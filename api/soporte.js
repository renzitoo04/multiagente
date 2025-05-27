import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const indicesRotacion = {}; // Almacena el índice actual de rotación por ID

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, numeros, mensaje } = req.body;

    if (!email || !numeros || numeros.length === 0) {
      return res.status(400).json({ error: 'Faltan datos requeridos (email, números o mensaje).' });
    }

    try {
      // Generar un ID único para el link
      const id = Math.random().toString(36).substring(2, 15);

      // Guardar la configuración en memoria (puedes usar Supabase para persistirla)
      const { error } = await supabase
        .from('link')
        .insert([{ id, email, numeros, mensaje }]);

      if (error) {
        console.error('Error al guardar en Supabase:', error);
        return res.status(500).json({ error: 'Error al guardar la configuración.' });
      }

      // Generar el link original
      const linkOriginal = `${req.headers.origin || 'http://localhost:3000'}/api/soporte?id=${id}`;

      // Acortar el link usando TinyURL
      const linkAcortado = await acortarLink(linkOriginal);

      return res.status(200).json({ link: linkAcortado });
    } catch (error) {
      console.error('Error al generar el link:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  }

  if (req.method === 'GET') {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Falta el ID en la consulta.' });
    }

    try {
      // Recuperar la configuración desde Supabase
      const { data: configuracion, error } = await supabase
        .from('link')
        .select('numeros, mensaje')
        .eq('id', id)
        .single();

      if (error || !configuracion) {
        return res.status(404).json({ error: 'No se encontró la configuración para este ID.' });
      }

      // Rotar el número
      if (!indicesRotacion[id]) {
        indicesRotacion[id] = 0; // Inicializa el índice si no existe
      }

      const indiceActual = indicesRotacion[id];
      const numeroActual = configuracion.numeros[indiceActual];

      // Incrementa el índice para la próxima rotación
      indicesRotacion[id] = (indiceActual + 1) % configuracion.numeros.length;

      // Redirige al número actual de WhatsApp
      const whatsappLink = `https://wa.me/${numeroActual}?text=${encodeURIComponent(configuracion.mensaje)}`;
      return res.redirect(302, whatsappLink);
    } catch (error) {
      console.error('Error al redirigir al número de WhatsApp:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido.' });
}

async function acortarLink(linkOriginal) {
  try {
    const response = await fetch('https://api.tinyurl.com/create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TINYURL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: linkOriginal, domain: 'tiny.one' }),
    });

    if (!response.ok) {
      console.error('Error al acortar el link:', await response.text());
      return linkOriginal; // Devuelve el link original si falla
    }

    const data = await response.json();
    return data.data.tiny_url;
  } catch (error) {
    console.error('Error en acortarLink:', error);
    return linkOriginal; // Devuelve el link original si hay un error
  }
}


