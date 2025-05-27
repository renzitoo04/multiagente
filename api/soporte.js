import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  // === 1. INICIO DE SESIÓN ===
  if (req.method === 'POST' && req.url === '/api/login') {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Faltan datos de inicio de sesión' });
    }

    try {
      // Consultar Supabase para validar las credenciales
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('email, limiteNumeros')
        .eq('email', email)
        .eq('password', password)
        .single();

      if (error || !usuario) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
      }

      // Responder con los datos del usuario
      return res.status(200).json({
        email: usuario.email,
        limiteNumeros: usuario.limiteNumeros,
      });
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // === 2. GENERAR LINK ===
  if (req.method === 'POST' && req.url === '/api/generar-link') {
    const { email, numeros, mensaje } = req.body;

    if (!email || !numeros || numeros.length === 0) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    const id = Math.random().toString(36).substring(2, 8);
    const linkOriginal = `${req.headers.origin}/soporte?id=${id}`;

    try {
      // Guardar la configuración en Supabase
      const { error } = await supabase.from('link').insert({
        id,
        email,
        numeros,
        mensaje,
        link: linkOriginal,
      });

      // Agrega este log aquí:
      if (error) {
        console.error('Error guardando en Supabase:', error);
        return res.status(500).json({ error: 'Error al guardar en base de datos', detalle: error.message });
      }

      return res.status(200).json({ id, link: linkOriginal });
    } catch (err) {
      console.error('Error generando el link:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // === 3. ACCEDER A UN LINK ===
  if (req.method === 'GET' && req.query.id) {
    const { id } = req.query;

    try {
      const { data, error } = await supabase.from('link').select('*').eq('id', id).single();

      if (error || !data) {
        return res.status(404).json({ error: 'ID no encontrado' });
      }

      const { numeros, mensaje } = data;
      const numeroActual = numeros[0]; // Usar el primer número como ejemplo

      const whatsappLink = `https://wa.me/${numeroActual}?text=${encodeURIComponent(mensaje)}`;
      return res.redirect(302, whatsappLink);
    } catch (err) {
      console.error('Error al obtener el link desde Supabase:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // === 4. ACTUALIZAR LINK ===
  if (req.method === 'PATCH' && req.url === '/soporte') {
    const { email, link, numeros, mensaje } = req.body;

    if (!email || !link || !numeros || numeros.length === 0) {
      return res.status(400).json({ error: 'Datos inválidos para actualizar el link' });
    }

    try {
      // Actualizar el link en la base de datos
      const { error } = await supabase
        .from('link')
        .update({ numeros, mensaje })
        .eq('link', link)
        .eq('email', email);

      if (error) {
        console.error('Error actualizando el link en Supabase:', error);
        return res.status(500).json({ error: 'Error al actualizar el link', detalle: error.message });
      }

      return res.status(200).json({ message: 'Link actualizado correctamente' });
    } catch (err) {
      console.error('Error al actualizar el link:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // === 5. OBTENER LINK POR EMAIL ===
  if (req.method === 'GET' && req.url.startsWith('/api/obtener-link')) {
    const email = req.query.email;

    if (!email) {
      return res.status(400).json({ error: 'Email no proporcionado' });
    }

    try {
      const { data, error } = await supabase
        .from('link')
        .select('id, link, numeros, mensaje')
        .eq('email', email)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'No se encontró un link para este perfil' });
      }

      return res.status(200).json(data);
    } catch (err) {
      console.error('Error al obtener el link:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  return res.status(400).json({ error: 'Solicitud inválida' });
}
