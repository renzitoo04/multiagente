import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email y contraseña requeridos' });

  // Verificar si el usuario ya existe
  const { data: existe, error: errorExiste } = await supabase
    .from('usuarios')
    .select('email')
    .eq('email', email)
    .single();

  if (errorExiste) {
    console.error('Error al buscar usuario:', errorExiste);
    return res.status(500).json({ error: errorExiste.message });
  }

  if (existe) return res.status(400).json({ error: 'El usuario ya existe' });

  // Crear usuario con limiteNumeros en 1
  const { error: errorInsert } = await supabase
    .from('usuarios')
    .insert([{ email, password, limiteNumeros: 1 }]);

  if (errorInsert) {
    console.error('Error al crear usuario:', errorInsert);
    return res.status(400).json({ error: errorInsert.message });
  }

  return res.status(200).json({ message: 'Usuario creado correctamente' });
}