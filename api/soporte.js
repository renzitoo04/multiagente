import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// === Funciones para manejar configuraciones en Supabase ===

// Obtener configuraciones desde Supabase
async function obtenerConfiguraciones() {
  const { data, error } = await supabase.from('configuraciones').select('*');
  if (error) {
    console.error('Error al obtener configuraciones:', error);
    return {};
  }
  return data.reduce((acc, config) => {
    acc[config.id] = config;
    return acc;
  }, {});
}

// Guardar una nueva configuración en Supabase
async function guardarConfiguracion(id, configuracion) {
  const { error } = await supabase
    .from('configuraciones')
    .upsert({ id, ...configuracion });
  if (error) {
    console.error('Error al guardar configuración:', error);
  }
}

// === Handler principal ===
export default async function handler(req, res) {
  const configuracionesPorID = await obtenerConfiguraciones();

  // === 1. Generar un nuevo link (POST) ===
  if (req.method === 'POST') {
    const { email, numeros, mensaje } = req.body;

    if (!email || !numeros || numeros.length === 0) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    const id = Math.random().toString(36).substring(2, 8);
    const linkOriginal = `${req.headers.origin}/soporte?id=${id}`;

    try {
      const linkAcortado = await acortarLink(linkOriginal);

      const { error } = await supabase.from('links').insert({
        id,
        email,
        numeros,
        mensaje,
        link: linkAcortado,
      });

      if (error) {
        console.error('Error guardando en Supabase:', error);
        return res.status(500).json({ error: 'Error al guardar en base de datos' });
      }

      return res.status(200).json({ id, link: linkAcortado });
    } catch (error) {
      console.error('Error generando el link:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // === 2. Acceder a un link generado (GET con ID) ===
  if (req.method === 'GET' && req.query.id) {
    const { id } = req.query;

    try {
      const { data, error } = await supabase.from('links').select('*').eq('id', id).single();

      if (error || !data) {
        return res.status(404).json({ error: 'ID no encontrado' });
      }

      const { numeros, mensaje } = data;
      const indice = indicesRotacion[id] ?? 0;
      const numeroActual = numeros[indice];

      indicesRotacion[id] = (indice + 1) % numeros.length;

      const whatsappLink = `https://wa.me/${numeroActual}?text=${encodeURIComponent(mensaje)}`;
      return res.redirect(302, whatsappLink);
    } catch (error) {
      console.error('Error al obtener el link desde Supabase:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // === 3. Actualizar un link existente (PATCH) ===
  if (req.method === 'PATCH') {
    const { link, numeros, mensaje } = req.body;
    const id = link.split('id=')[1];

    try {
      const { data, error } = await supabase.from('links').select('*').eq('id', id).single();

      if (error || !data) {
        return res.status(404).json({ error: 'Link no encontrado' });
      }

      const { error: updateError } = await supabase.from('links').update({
        numeros,
        ...(mensaje !== undefined && { mensaje }),
      }).eq('id', id);

      if (updateError) {
        console.error('Error actualizando en Supabase:', updateError);
        return res.status(500).json({ error: 'Error al actualizar' });
      }

      return res.status(200).json({ success: true, link: data.link });
    } catch (error) {
      console.error('Error al actualizar el link:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  return res.status(400).json({ error: 'Solicitud inválida' });
}


