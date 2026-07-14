import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const ES_HASH_BCRYPT = /^\$2[aby]\$/;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan datos de inicio de sesión' });
  }

  try {
    // Verificar usuario en Supabase
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('email, password, limiteNumeros')
      .eq('email', email.trim())
      .single();

    if (error || !usuario) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const passwordIngresada = password.trim();
    const passwordGuardada = usuario.password.trim();
    let passwordValida;

    if (ES_HASH_BCRYPT.test(passwordGuardada)) {
      passwordValida = await bcrypt.compare(passwordIngresada, passwordGuardada);
    } else {
      // Cuenta creada antes de que hubiera hash: comparamos en texto plano
      // y migramos la contraseña a hash de forma transparente si coincide.
      passwordValida = passwordGuardada === passwordIngresada;
      if (passwordValida) {
        const nuevoHash = await bcrypt.hash(passwordIngresada, 10);
        supabase
          .from('usuarios')
          .update({ password: nuevoHash })
          .eq('email', email.trim())
          .then(({ error: errorMigracion }) => {
            if (errorMigracion) console.error('No se pudo migrar la contraseña a hash:', errorMigracion);
          });
      }
    }

    if (!passwordValida) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    return res.status(200).json({
      email: usuario.email,
      limiteNumeros: usuario.limiteNumeros,
    });
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}
