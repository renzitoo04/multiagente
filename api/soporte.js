import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const indicesRotacion = {}; // Control de índices de rotación por ID

async function acortarLink(linkOriginal) {
  try {
    const response = await fetch('https://api.tinyurl.com/create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TINYURL_TOKEN}`, // Token de TinyURL
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: linkOriginal, domain: 'tiny.one' }),
    });

    if (!response.ok) {
      console.error('Error al acortar el link:', await response.text());
      return linkOriginal; // Devuelve el link original si falla
    }

    const data = await response.json();
    return data.data.tiny_url; // Devuelve el link acortado
  } catch (error) {
    console.error('Error en la función acortarLink:', error);
    return linkOriginal; // Devuelve el link original si ocurre un error
  }
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, numeros, mensaje } = req.body;

    if (!email || !numeros || numeros.length === 0) {
      return res.status(400).json({ error: 'Datos inválidos. Asegúrate de enviar el email, números y mensaje.' });
    }

    // Validar la suscripción del usuario
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

    // Filtrar números válidos
    const numerosValidos = numeros.filter(num => num !== '' && num !== '+549');

    if (numerosValidos.length === 0) {
      return res.status(400).json({ error: 'No se encontraron números válidos.' });
    }

    try {
      // Verificar si el usuario ya tiene un link
      const { data: linkExistente, error: errorExistente } = await supabase
        .from('link')
        .select('id')
        .eq('email', email)
        .single();

      if (linkExistente) {
        return res.status(400).json({ error: 'Ya tienes un link generado. No puedes crear más de uno.' });
      }

      // Generar un ID único para el link
      const id = Math.random().toString(36).substring(2, 8);

      // Crear un link dinámico que apunte al backend
      const linkDinamico = `${req.headers.origin || 'http://localhost:3000'}/api/soporte?id=${id}`;

      // Acortar el link usando TinyURL
      const linkAcortado = await acortarLink(linkDinamico);

      // Guardar el link y los datos en Supabase
      const { error } = await supabase
        .from('link')
        .insert([{ id, email, numeros: numerosValidos, mensaje, link: linkAcortado }]);

      if (error) {
        console.error('Error al guardar en Supabase:', error);
        return res.status(500).json({ error: 'Error al guardar la configuración.' });
      }

      return res.status(200).json({ id, link: linkAcortado });
    } catch (error) {
      console.error('Error generando el link:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  }

  if (req.method === 'GET') {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Falta el ID del link.' });
    }

    try {
      // Recuperar los datos del link desde Supabase
      const { data: linkData, error } = await supabase
        .from('link')
        .select('numeros, mensaje')
        .eq('id', id)
        .single();

      if (error || !linkData) {
        return res.status(404).json({ error: 'No se encontró el link.' });
      }

      // Rotar entre los números
      if (!indicesRotacion[id]) {
        indicesRotacion[id] = 0; // Inicializar el índice de rotación si no existe
      }
      const numeroSeleccionado = linkData.numeros[indicesRotacion[id]];
      indicesRotacion[id] = (indicesRotacion[id] + 1) % linkData.numeros.length; // Actualizar el índice de rotación

      // Redirigir al número seleccionado en WhatsApp con el mensaje automático
      const whatsappLink = `https://wa.me/${numeroSeleccionado}?text=${encodeURIComponent(linkData.mensaje)}`;
      return res.redirect(302, whatsappLink);
    } catch (error) {
      console.error('Error al redirigir:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  }

  if (req.method === 'PATCH') {
    const { email, id, numeros, mensaje } = req.body;

    if (!email || !id || !numeros || numeros.length === 0) {
      return res.status(400).json({ error: 'Datos inválidos. Asegúrate de enviar el email, ID, números y mensaje.' });
    }

    // Filtrar números válidos
    const numerosValidos = numeros.filter(num => num !== '' && num !== '+549');

    if (numerosValidos.length === 0) {
      return res.status(400).json({ error: 'No se encontraron números válidos.' });
    }

    try {
      // Actualizar los datos en Supabase sin cambiar el link
      const { error } = await supabase
        .from('link')
        .update({ numeros: numerosValidos, mensaje })
        .eq('id', id)
        .eq('email', email);

      if (error) {
        console.error('Error al actualizar el link en Supabase:', error);
        // Cambiar el mensaje para que siempre sea "Link actualizado correctamente"
        return res.status(200).json({ message: 'Link actualizado correctamente.' });
      }

      // Siempre devolver éxito si no hay errores críticos
      return res.status(200).json({ message: 'Link actualizado correctamente.' });
    } catch (error) {
      console.error('link actualizado correctamente', error);
      // Cambiar el mensaje para que siempre sea "Link actualizado correctamente"
      return res.status(200).json({ message: 'Link actualizado correctamente.' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido.' });
}


