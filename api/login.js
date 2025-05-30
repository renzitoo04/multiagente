import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Faltan credenciales.' });
    }

    try {
      const { data: user, error } = await supabase
        .from('usuarios')
        .select('id, email, limiteNumeros')
        .eq('email', email)
        .single();

      if (error || !user) {
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }

      // Aquí puedes validar la contraseña si es necesario

      return res.status(200).json({ email: user.email, limiteNumeros: user.limiteNumeros });
    } catch (error) {
      console.error('Error al recuperar el usuario:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido.' });
}
