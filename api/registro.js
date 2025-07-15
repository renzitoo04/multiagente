import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

  // Crear usuario en la tabla de usuarios (ajusta el nombre de la tabla si es necesario)
  const { error } = await supabase
    .from('usuarios')
    .insert([{ email, password, limiteNumeros: 0 }]);

  if (error) return res.status(400).json({ error: error.message });

  return res.status(200).json({ message: 'Usuario creado correctamente' });
}