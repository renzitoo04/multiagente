import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  // Agregar logs para depuración
  console.log('Solicitud recibida:', {
    method: req.method,
    body: req.body
  });

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan datos de inicio de sesión' });
  }

  try {
    console.log('Consultando Supabase con:', { email, password });

    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('*')  // Seleccionar todos los campos para depuración
      .eq('email', email.toLowerCase())  // Convertir a minúsculas
      .eq('password', password)
      .single();

    console.log('Respuesta de Supabase:', { usuario, error });

    if (error || !usuario) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    return res.status(200).json({
      email: usuario.email,
      limiteNumeros: usuario.limiteNumeros
    });
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
