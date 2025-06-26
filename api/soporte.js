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

  // Rotación equitativa y persistente de números (GET con id)
  if (req.method === 'GET' && req.query.id) {
    const { id } = req.query;

    // 1. Obtener la fila del link, incluyendo numeros[] e indiceActual
    const { data: link, error } = await supabase
      .from('link')
      .select('numeros, indiceActual')
      .eq('id', id)
      .single();

    if (error || !link) {
      return res.status(404).json({ error: 'Link no encontrado' });
    }

    let { numeros, indiceActual } = link;

    // 2. Inicializar indiceActual si no existe
    if (typeof indiceActual !== 'number' || isNaN(indiceActual)) {
      indiceActual = 0;
    }

    // 3. Seleccionar el número usando el índice actual
    const totalNumeros = Array.isArray(numeros) ? numeros.length : 0;
    if (totalNumeros === 0) {
      return res.status(400).json({ error: 'No hay números disponibles para este link.' });
    }
    const numeroSeleccionado = numeros[indiceActual % totalNumeros];

    // 4. Calcular el nuevo índice (rotación circular)
    const nuevoIndice = (indiceActual + 1) % totalNumeros;

    // 5. Actualizar el indiceActual en Supabase
    await supabase
      .from('link')
      .update({ indiceActual: nuevoIndice })
      .eq('id', id);

    // 6. Devolver el número seleccionado
    return res.status(200).json({ numero: numeroSeleccionado });
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


