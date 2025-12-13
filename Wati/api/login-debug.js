// ============================================
// LOGIN DEBUG - ENDPOINT TEMPORAL
// ============================================
// Reemplaza temporalmente /api/login con este para ver qué pasa

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email, password } = req.body;

  console.log('🔍 LOGIN DEBUG:');
  console.log('   Email recibido:', email);
  console.log('   Password recibido:', password);
  console.log('   Email trimmed:', email?.trim());
  console.log('   SUPABASE_URL:', process.env.SUPABASE_URL);
  console.log('   SUPABASE_KEY configurado:', !!process.env.SUPABASE_KEY);

  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan datos de inicio de sesión' });
  }

  try {
    // Paso 1: Buscar usuario
    console.log('\n📊 Buscando usuario...');
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('email, password, limiteNumeros')
      .eq('email', email.trim())
      .single();

    console.log('   Error:', error);
    console.log('   Usuario encontrado:', usuario);

    if (error) {
      console.log('   ❌ Error de Supabase:', error.message);
      console.log('   Código:', error.code);
      console.log('   Detalles:', error.details);
      return res.status(401).json({
        error: 'Usuario no encontrado',
        debug: {
          error: error.message,
          code: error.code,
          emailBuscado: email.trim()
        }
      });
    }

    if (!usuario) {
      console.log('   ❌ Usuario es null');
      return res.status(401).json({
        error: 'Usuario no encontrado (null)',
        debug: {
          emailBuscado: email.trim()
        }
      });
    }

    // Paso 2: Verificar password
    console.log('\n🔑 Verificando password...');
    console.log('   Password en BD:', usuario.password);
    console.log('   Password recibido:', password);
    console.log('   Password BD trimmed:', usuario.password.trim());
    console.log('   Password recibido trimmed:', password.trim());
    console.log('   ¿Son iguales?:', usuario.password.trim() === password.trim());

    if (usuario.password.trim() !== password.trim()) {
      return res.status(401).json({
        error: 'Contraseña incorrecta',
        debug: {
          passwordEnBD: usuario.password,
          passwordRecibido: password,
          sonIguales: usuario.password.trim() === password.trim()
        }
      });
    }

    // Paso 3: Login exitoso
    console.log('\n✅ Login exitoso!');
    return res.status(200).json({
      email: usuario.email,
      limiteNumeros: usuario.limiteNumeros || 10,
      debug: 'Login OK'
    });

  } catch (err) {
    console.error('❌ Error en login:', err);
    return res.status(500).json({
      error: 'Error interno del servidor',
      debug: {
        message: err.message,
        stack: err.stack
      }
    });
  }
}
