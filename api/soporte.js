import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const indicesRotacion = {}; // Control de índices de rotación por ID

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, numeros, mensaje } = req.body;

    if (!email || !numeros || numeros.length === 0) {
      return res.status(400).json({ error: 'Datos inválidos. Asegúrate de enviar el email, los números y el mensaje.' });
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

      const id = Math.random().toString(36).substring(2, 8);
      const linkOriginal = `${req.headers.origin || 'http://localhost:3000'}/api/redirect?id=${id}`;

      // Acortar el link usando TinyURL
      const tinyUrlResponse = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(linkOriginal)}`);
      const linkAcortado = tinyUrlResponse.data;

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

  if (req.method === 'PATCH') {
    const { email, numeros, mensaje, id } = req.body;

    if (!email || !numeros || numeros.length === 0 || !id) {
      return res.status(400).json({ error: 'Datos inválidos para actualizar el link.' });
    }

    // Filtrar números válidos en el backend
    const numerosValidos = numeros.filter(num => num !== '' && num !== '+549');

    if (numerosValidos.length === 0) {
      return res.status(400).json({ error: 'No se encontraron números válidos.' });
    }

    try {
      const linkOriginal = `${req.headers.origin || 'http://localhost:3000'}/api/soporte?id=${id}`;
      const linkAcortado = await acortarLink(linkOriginal);

      const { error } = await supabase
        .from('link')
        .update({ numeros: numerosValidos, mensaje, link: linkAcortado })
        .eq('id', id)
        .eq('email', email);

      if (error) {
        console.error('Error al actualizar en Supabase:', error);
        return res.status(500).json({ error: 'Error al actualizar el link.' });
      }

      return res.status(200).json({ link: linkAcortado });
    } catch (error) {
      console.error('Error actualizando el link:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido.' });
}


