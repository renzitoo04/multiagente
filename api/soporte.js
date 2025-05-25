import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Conectar a Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// === Funciones para manejar configuraciones en Supabase ===

// Obtener configuraciones desde Supabase
async function obtenerConfiguraciones() {
  const { data, error } = await supabase.from('configuraciones').select('*');
  if (error) {
    console.error('Error al obtener configuraciones:', error);
    return {};
  }
  // Convertir los datos en un objeto con IDs como claves
  return data.reduce((acc, config) => {
    acc[config.id] = config;
    return acc;
  }, {});
}

// Guardar una nueva configuración en Supabase
async function guardarConfiguracion(id, configuracion) {
  const { error } = await supabase
    .from('configuraciones')
    .upsert({ id, ...configuracion }); // Inserta o actualiza la configuración
  if (error) {
    console.error('Error al guardar configuración:', error);
  }
}

// === Handler principal ===
export default async function handler(req, res) {
  // Cargar configuraciones desde Supabase
  const configuracionesPorID = await obtenerConfiguraciones();

  // === 1. Generar un nuevo link (POST) ===
  if (req.method === 'POST') {
    const { email, numeros, mensaje } = req.body;

    if (!email || !numeros || numeros.length === 0) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    // Generar un nuevo ID y link original
    const id = Math.random().toString(36).substring(2, 8);
    const linkOriginal = `${req.headers.origin}/soporte?id=${id}`;

    try {
      // Acortar el link original
      const linkAcortado = await acortarLink(linkOriginal);

      // Guardar la nueva configuración en Supabase
      const { error } = await supabase.from('links').insert({
        id,
        email,
        numeros,
        mensaje,
        link: linkAcortado
      });

      if (error) {
        console.error('Error guardando en Supabase:', error);
        return res.status(500).json({ error: 'Error al guardar en base de datos' });
      }

      // Devolver el link generado
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
      // Obtener los datos del link desde Supabase
      const { data, error } = await supabase.from('links').select('*').eq('id', id).single();

      if (error || !data) {
        return res.status(404).json({ error: 'ID no encontrado' });
      }

      // Extraer los datos necesarios
      const { numeros, mensaje } = data;

      // Manejar la rotación de números
      const indice = indicesRotacion[id] ?? 0;
      const numeroActual = numeros[indice];

      // Actualizar el índice para la próxima rotación
      indicesRotacion[id] = (indice + 1) % numeros.length;

      // Redirigir al número actual de WhatsApp
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

    // Extraer el ID del link
    const id = link.split('id=')[1];

    try {
      // Verificar si el link existe en Supabase
      const { data, error } = await supabase.from('links').select('*').eq('id', id).single();

      if (error || !data) {
        return res.status(404).json({ error: 'Link no encontrado' });
      }

      // Actualizar los datos en Supabase
      const { error: updateError } = await supabase.from('links').update({
        numeros,
        ...(mensaje !== undefined && { mensaje }) // Solo actualizar el mensaje si está definido
      }).eq('id', id);

      if (updateError) {
        console.error('Error actualizando en Supabase:', updateError);
        return res.status(500).json({ error: 'Error al actualizar' });
      }

      // Devolver el link actualizado
      return res.status(200).json({ success: true, link: data.link });
    } catch (error) {
      console.error('Error al actualizar el link:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  return res.status(400).json({ error: 'Solicitud inválida' });
}


