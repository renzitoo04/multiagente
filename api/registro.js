import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const { email, password, telefono } = req.body; // 👈 agregamos telefono
  if (!email || !password || !telefono) {
    return res.status(400).json({ error: 'Email, contraseña y teléfono requeridos' });
  }

  // Verificar si el usuario ya existe
  const { data: existe, error: errorExiste } = await supabase
    .from('usuarios')
    .select('email')
    .eq('email', email)
    .single();

  if (errorExiste && errorExiste.code !== 'PGRST116') {
    console.error('Error al buscar usuario:', errorExiste);
    return res.status(500).json({ error: errorExiste.message });
  }

  if (existe) return res.status(400).json({ error: 'El usuario ya existe' });

  // Crear usuario con limiteNumeros en 1 y guardar el teléfono en la columna "numeros"
  const passwordHasheada = await bcrypt.hash(password, 10);
  const { error: errorInsert } = await supabase
    .from('usuarios')
    .insert([{ email, password: passwordHasheada, telefono, limiteNumeros: 1 }]); // 👈 acá lo guardamos

  if (errorInsert) {
    console.error('Error al crear usuario:', errorInsert);
    return res.status(400).json({ error: errorInsert.message });
  }

  return res.status(200).json({
    message: 'Usuario creado correctamente',
  });
}
