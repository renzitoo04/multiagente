import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan datos de inicio de sesión' });
  }

  try {
    // ATENCIÓN: usar los nombres EXACTOS de las columnas con comillas
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('correo electrónico', email)
      .eq('contraseña', password)
      .single();

    if (error || !data) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    return res.status(200).json({
      email: data['correo electrónico'],
      limiteNumeros: data['número_límite']
    });
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
