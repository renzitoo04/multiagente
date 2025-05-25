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
    // Consultar Supabase para validar las credenciales
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('email, limiteNumeros')
      .eq('email', email)
      .eq('password', password) // Asegúrate de que las contraseñas estén almacenadas de forma segura
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
