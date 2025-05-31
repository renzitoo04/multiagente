import { supabase } from '../../utils/supabaseClient';

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Falta el ID del link.' });
  }

  try {
    // Buscar el link en la base de datos
    const { data: linkData, error } = await supabase
      .from('link')
      .select('numeros')
      .eq('id', id)
      .single();

    if (error || !linkData) {
      return res.status(404).json({ error: 'No se encontró el link.' });
    }

    // Rotar entre los números
    const numeros = linkData.numeros;
    const numeroSeleccionado = numeros[Math.floor(Math.random() * numeros.length)];

    // Redirigir al número seleccionado en WhatsApp
    const whatsappLink = `https://wa.me/${numeroSeleccionado}`;
    return res.redirect(302, whatsappLink);
  } catch (error) {
    console.error('Error al redirigir:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
}