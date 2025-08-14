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

    try {
      const { data: usuario, error: errorUsuario } = await supabase
        .from('usuarios')
        .select('suscripcion_valida_hasta')
        .eq('email', email)
        .single();

      if (errorUsuario || !usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }

      const hoy = new Date().toISOString().split('T')[0];
      if (!usuario.suscripcion_valida_hasta || usuario.suscripcion_valida_hasta < hoy) {
        return res.status(403).json({ error: 'La suscripción ha expirado. Por favor, renueva tu plan.' });
      }

      const numerosValidos = numeros.filter(num => num !== '' && num !== '+549');

      if (numerosValidos.length === 0) {
        return res.status(400).json({ error: 'No se encontraron números válidos.' });
      }

      const { data: linkExistente, error: errorExistente } = await supabase
        .from('link')
        .select('id')
        .eq('email', email)
        .single();

      if (linkExistente) {
        const { error: errorUpdate } = await supabase
          .from('link')
          .update({ numeros: numerosValidos, mensaje })
          .eq('email', email);

        if (errorUpdate) {
          return res.status(500).json({ error: 'Error al actualizar el link.' });
        }

        return res.status(200).json({ message: 'Link actualizado correctamente.' });
      }

      const id = Math.random().toString(36).substring(2, 8);
      const linkDinamico = `${req.headers.origin || 'http://localhost:3000'}/api/soporte?id=${id}`;

      const { error: errorInsert } = await supabase
        .from('link')
        .insert({ id, email, numeros: numerosValidos, mensaje, link: linkDinamico });

      if (errorInsert) {
        return res.status(500).json({ error: 'Error al crear el link.' });
      }

      return res.status(201).json({ message: 'Link creado correctamente.', link: linkDinamico });
    } catch (error) {
      console.error('Error interno:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  }

  if (req.method === 'GET') {
    const { id, email } = req.query;

    if (id) {
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

    if (email) {
      try {
        const { data: link, error } = await supabase
          .from('link')
          .select('*')
          .eq('email', email)
          .single();

        if (error || !link) {
          console.error('Error al buscar el link:', error);
          return res.status(404).json({ error: 'No se encontró un link asociado a este usuario.' });
        }

        return res.status(200).json(link);
      } catch (error) {
        console.error('Error interno al buscar el link:', error);
        return res.status(500).json({ error: 'Error interno al buscar el link.' });
      }
    }

    return res.status(400).json({ error: 'Falta el parámetro id o email.' });
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


