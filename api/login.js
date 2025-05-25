import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Conectar a Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, password } = req.body;

    // Validar que ambos campos estén presentes
    if (!email || !password) {
      return res.status(400).json({ error: 'Faltan datos de inicio de sesión' });
    }

    try {
      // Consultar Supabase para verificar las credenciales
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();

      // Manejar errores o credenciales incorrectas
      if (error || !usuario) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
      }

      // Responder con los datos del usuario
      return res.status(200).json({
        email: usuario.email,
        limiteNumeros: usuario.limiteNumeros,
      });
    } catch (error) {
      console.error('Error al validar el login en Supabase:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // Manejar métodos no permitidos
  return res.status(405).json({ error: 'Método no permitido' });
}