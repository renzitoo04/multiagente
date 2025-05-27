import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

console.log('Conectando a:', process.env.SUPABASE_URL);

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
    const { data: user, error } = await supabase
      .from('users')
      .select('email, limiteNumeros')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Devuelve el límite de números junto con otros datos del usuario
    return res.status(200).json({ email: user.email, limiteNumeros: user.limiteNumeros || 2 });
  } catch (err) {
    console.error('Error al iniciar sesión:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
