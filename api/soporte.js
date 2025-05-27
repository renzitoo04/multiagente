import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

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
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    try {
      // Generar un nuevo ID y link original
      const id = Math.random().toString(36).substring(2, 8);
      const linkOriginal = `${req.headers.origin || 'http://localhost:3000'}/soporte?id=${id}`;

      // Acortar el link usando TinyURL
      const linkAcortado = await acortarLink(linkOriginal);

      // Guardar la información en Supabase
      const { error } = await supabase
        .from('link')
        .insert([{ id, email, numeros, mensaje, link: linkAcortado }]);

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

  if (req.method === 'PATCH') {
    const { email, numeros, mensaje, link } = req.body;

    if (!email || !numeros || numeros.length === 0 || !link) {
      return res.status(400).json({ error: 'Datos inválidos para actualizar el link.' });
    }

    try {
      // Actualizar el registro en Supabase
      const { error } = await supabase
        .from('link')
        .update({ numeros, mensaje })
        .eq('email', email)
        .eq('link', link);

      if (error) {
        console.error('Error al actualizar el link en Supabase:', error);
        return res.status(500).json({ error: 'Error al actualizar el link.' });
      }

      return res.status(200).json({ message: 'Link actualizado correctamente.' });
    } catch (error) {
      console.error('Error interno al actualizar el link:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido.' });
}


