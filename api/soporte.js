import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const indicesRotacion = {}; // Control de índices de rotación por ID

// ✅ Función para limpiar números (solo dígitos)
function limpiarNumero(numero) {
  if (!numero) return '';
  return String(numero).replace(/\D/g, '');
}

// ✅ Función para acortar links (placeholder)
async function acortarLink(linkOriginal) {
  try {
    return linkOriginal;
  } catch (error) {
    console.error('Error en la función acortarLink:', error);
    return linkOriginal;
  }
}

export default async function handler(req, res) {
  // 🔹 Crear nuevo link
  if (req.method === 'POST') {
    const { email, numeros, mensaje } = req.body;

    if (!email || !numeros || numeros.length === 0) {
      return res.status(400).json({ error: 'Datos inválidos. Asegúrate de enviar el email, números y mensaje.' });
    }

    // Validar la suscripción
    try {
      const { data: usuario, error: errorUsuario } = await supabase
        .from('usuarios')
        .select('suscripcion_valida_hasta')
        .eq('email', email)
        .single();

      if (errorUsuario || !usuario) {
        console.error('Error al verificar la suscripción:', errorUsuario);
        return res.status(500).json({ error: 'Error al verificar la suscripción.' });
      }

      const hoy = new Date().toISOString().split('T')[0];
      if (!usuario.suscripcion_valida_hasta || usuario.suscripcion_valida_hasta < hoy) {
        return res.status(403).json({
          error: 'Tu suscripción ha vencido. Por favor, renovala para continuar.',
        });
      }
    } catch (error) {
      console.error('Error al verificar la suscripción:', error);
      return res.status(500).json({ error: 'Error interno al verificar la suscripción.' });
    }

    // Filtrar y limpiar números válidos
    const numerosValidos = numeros
      .filter(num => num && num !== '+549')
      .map(limpiarNumero)
      .filter(n => n.length > 5);

    if (numerosValidos.length === 0) {
      return res.status(400).json({ error: 'No se encontraron números válidos.' });
    }

    try {
      // Verificar si el usuario ya tiene un link
      const { data: linkExistente } = await supabase
        .from('link')
        .select('id')
        .eq('email', email)
        .single();

      if (linkExistente) {
        return res.status(400).json({ error: 'Ya tienes un link generado. No puedes crear más de uno.' });
      }

      // Generar ID único
      const id = Math.random().toString(36).substring(2, 8);

      // Crear link dinámico
      const linkDinamico = `${req.headers.origin || 'http://localhost:3000'}/api/soporte?id=${id}`;

      // Guardar en Supabase
      const { error } = await supabase
        .from('link')
        .insert([{ id, email, numeros: numerosValidos, mensaje, link: linkDinamico }]);

      if (error) {
        console.error('Error al guardar en Supabase:', error);
        return res.status(500).json({ error: 'Error al guardar la configuración.' });
      }

      return res.status(200).json({ id, link: linkDinamico });
    } catch (error) {
      console.error('Error generando el link:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  }

  // 🔹 Redirección al número de WhatsApp
  if (req.method === 'GET') {
    const { id } = req.query;

    if (!id) return res.status(400).json({ error: 'Falta el ID del link.' });

    try {
      const { data: linkData, error } = await supabase
        .from('link')
        .select('numeros, mensaje, email')
        .eq('id', id)
        .single();

      if (error || !linkData) {
        return res.status(404).send('404 - Not Found');
      }

      // Verificar que la suscripción del dueño del link siga vigente.
      // Si venció, el link deja de funcionar (404) sin borrar ni tocar nada
      // en Supabase; en cuanto la suscripción vuelva a estar activa, el
      // mismo link funciona de nuevo automáticamente.
      const { data: usuario, error: errorUsuario } = await supabase
        .from('usuarios')
        .select('suscripcion_valida_hasta')
        .eq('email', linkData.email)
        .single();

      const suscripcionVencida =
        errorUsuario ||
        !usuario ||
        !usuario.suscripcion_valida_hasta ||
        new Date(usuario.suscripcion_valida_hasta) < new Date();

      if (suscripcionVencida) {
        return res.status(404).send('404 - Not Found');
      }

      // Registrar el click (asincrónicamente)
      (async () => {
        try {
          const ip = String((req.headers['x-forwarded-for'] || req.socket.remoteAddress || '')).split(',')[0].trim();
          const ua = req.headers['user-agent'] || '';
          const referer = req.headers['referer'] || req.headers['referrer'] || '';
          await supabase.from('clicks').insert([{ link_id: id, ip, ua, referer }]);
        } catch (e) {
          console.error('No se pudo registrar el click:', e);
        }
      })();

      // Rotación entre números
      if (!indicesRotacion[id]) indicesRotacion[id] = 0;
      const numeroSeleccionado = limpiarNumero(linkData.numeros[indicesRotacion[id]]);
      indicesRotacion[id] = (indicesRotacion[id] + 1) % linkData.numeros.length;

      const mensajeCodificado = encodeURIComponent(linkData.mensaje || '');
      const whatsappLink = `https://wa.me/${numeroSeleccionado}?text=${mensajeCodificado}`;

      // ✅ Validar formato antes de redirigir
      try {
        new URL(whatsappLink);
        return res.redirect(302, whatsappLink);
      } catch (err) {
        console.error('Error: link inválido generado →', whatsappLink);
        return res.status(400).json({ error: 'Link de WhatsApp inválido.' });
      }
    } catch (error) {
      console.error('Error al redirigir:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  }

  // 🔹 Actualizar link existente
  if (req.method === 'PATCH') {
    const { email, id, numeros, mensaje } = req.body;

    if (!email || !id || !numeros || numeros.length === 0) {
      return res.status(400).json({ error: 'Datos inválidos. Asegúrate de enviar el email, ID, números y mensaje.' });
    }

    const numerosValidos = numeros
      .filter(num => num && num !== '+549')
      .map(limpiarNumero)
      .filter(n => n.length > 5);

    if (numerosValidos.length === 0) {
      return res.status(400).json({ error: 'No se encontraron números válidos.' });
    }

    try {
      const { error } = await supabase
        .from('link')
        .update({ numeros: numerosValidos, mensaje })
        .eq('id', id)
        .eq('email', email);

      if (error) {
        console.error('Error al actualizar el link en Supabase:', error);
        return res.status(500).json({ error: 'No se pudo actualizar el link.' });
      }

      return res.status(200).json({ message: 'Link actualizado correctamente.' });
    } catch (error) {
      console.error('Error actualizando link:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  }

  // 🔹 Método no permitido
  return res.status(405).json({ error: 'Método no permitido.' });
}
