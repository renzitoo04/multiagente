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
      return res.status(400).json({ error: 'Faltan datos para generar el link.' });
    }

    try {
      // Generar un ID único para el link
      const id = Math.random().toString(36).substring(2, 8);

      // Crear el link que rota entre los números
      const link = `${req.headers.origin || 'http://localhost:3000'}/api/redirect?id=${id}`;

      // Guardar el link y los datos en Supabase
      const { error } = await supabase
        .from('link')
        .insert([{ id, email, numeros, mensaje, link }]);

      if (error) {
        console.error('Error al guardar en Supabase:', error);
        return res.status(500).json({ error: 'Error al guardar el link.' });
      }

      return res.status(200).json({ id, link });
    } catch (error) {
      console.error('Error generando el link:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  }

  if (req.method === 'GET') {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Falta el email en la consulta.' });
    }

    try {
      const { data: link, error } = await supabase
        .from('link')
        .select('id, numeros, mensaje, link')
        .eq('email', email)
        .single();

      if (error || !link) {
        return res.status(404).json({ error: 'No se encontró un link asociado a este usuario.' });
      }

      return res.status(200).json(link);
    } catch (error) {
      console.error('Error al recuperar el link:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  }
}


