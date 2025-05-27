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

  console.log('Email recibido:', email, 'len:', email.length);
  console.log('Password recibido:', password, 'len:', password.length);

  try {
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('email, limiteNumeros, password')
      .eq('email', email.trim())
      .single();

    console.log('Resultado búsqueda solo por email:', usuario);

    if (error || !usuario) {
      console.log('Error de Supabase:', error);
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    console.log('Email en base:', usuario.email, 'len:', usuario.email.length);
    console.log('Password en base:', usuario.password, 'len:', usuario.password.length);

    if (usuario.password.trim() !== password.trim()) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
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
