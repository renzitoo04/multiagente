// ============================================
// SCRIPT DE VERIFICACIÓN DE SUPABASE
// ============================================
// Ejecuta este script para verificar que Supabase está bien configurado
// Comando: node verificar-supabase.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function verificar() {
  console.log('🔍 Verificando configuración de Supabase...\n');

  // 1. Verificar variables de entorno
  console.log('1️⃣ Variables de entorno:');
  console.log('   SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌ NO CONFIGURADA');
  console.log('   SUPABASE_KEY:', process.env.SUPABASE_KEY ? '✅' : '❌ NO CONFIGURADA');

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.log('\n❌ ERROR: Variables de entorno no configuradas');
    console.log('Crea un archivo .env con:');
    console.log('SUPABASE_URL=tu_url');
    console.log('SUPABASE_KEY=tu_service_role_key\n');
    process.exit(1);
  }

  // 2. Verificar tipo de key
  try {
    const payload = JSON.parse(atob(process.env.SUPABASE_KEY.split('.')[1]));
    console.log('\n2️⃣ Tipo de key:');
    console.log('   Role:', payload.role);

    if (payload.role === 'anon') {
      console.log('   ❌ ERROR: Estás usando el ANON key');
      console.log('   ⚠️  Necesitas el SERVICE_ROLE key');
      console.log('   📍 Ve a: https://supabase.com/dashboard/project/nuhxzshvwluaqgpvljwh/settings/api');
      console.log('   📋 Copia el "service_role" key (NO el "anon" key)\n');
      process.exit(1);
    } else if (payload.role === 'service_role') {
      console.log('   ✅ Correcto: Service Role key');
    } else {
      console.log('   ⚠️  Role desconocido:', payload.role);
    }
  } catch (e) {
    console.log('   ⚠️  No se pudo validar el key');
  }

  // 3. Verificar conexión
  console.log('\n3️⃣ Probando conexión con Supabase...');
  try {
    const { data, error } = await supabase.from('usuarios').select('count').limit(1);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log('   ❌ La tabla "usuarios" no existe');
        console.log('   📋 Ejecuta setup-completo-supabase.sql en Supabase SQL Editor\n');
        process.exit(1);
      } else {
        console.log('   ❌ Error:', error.message);
        process.exit(1);
      }
    } else {
      console.log('   ✅ Conexión exitosa');
    }
  } catch (error) {
    console.log('   ❌ Error de conexión:', error.message);
    process.exit(1);
  }

  // 4. Verificar tablas
  console.log('\n4️⃣ Verificando tablas...');

  const tablas = ['usuarios', 'link', 'clicks'];
  let todasExisten = true;

  for (const tabla of tablas) {
    try {
      const { error } = await supabase.from(tabla).select('count').limit(0);
      if (error) {
        console.log(`   ❌ Tabla "${tabla}" no existe`);
        todasExisten = false;
      } else {
        console.log(`   ✅ Tabla "${tabla}" existe`);
      }
    } catch (e) {
      console.log(`   ❌ Error verificando tabla "${tabla}"`);
      todasExisten = false;
    }
  }

  if (!todasExisten) {
    console.log('\n   📋 Ejecuta setup-completo-supabase.sql en Supabase SQL Editor\n');
    process.exit(1);
  }

  // 5. Verificar usuario de prueba
  console.log('\n5️⃣ Verificando usuario de prueba...');
  try {
    const { data: usuario, error } = await supabase
      .from('usuarios')
      .select('email, limiteNumeros')
      .eq('email', 'test@linkify.com')
      .single();

    if (error || !usuario) {
      console.log('   ❌ Usuario de prueba no existe');
      console.log('   📋 Ejecuta setup-completo-supabase.sql para crearlo\n');
      process.exit(1);
    } else {
      console.log('   ✅ Usuario de prueba existe:', usuario.email);
      console.log('   📊 Límite de números:', usuario.limiteNumeros);
    }
  } catch (e) {
    console.log('   ❌ Error verificando usuario:', e.message);
    process.exit(1);
  }

  // 6. Contar registros
  console.log('\n6️⃣ Contando registros...');
  try {
    const { count: usuarios } = await supabase.from('usuarios').select('*', { count: 'exact', head: true });
    const { count: links } = await supabase.from('link').select('*', { count: 'exact', head: true });
    const { count: clicks } = await supabase.from('clicks').select('*', { count: 'exact', head: true });

    console.log('   📊 Usuarios:', usuarios || 0);
    console.log('   📊 Links:', links || 0);
    console.log('   📊 Clicks:', clicks || 0);
  } catch (e) {
    console.log('   ⚠️  No se pudo contar registros');
  }

  // ✅ Todo OK
  console.log('\n' + '='.repeat(50));
  console.log('✅ ¡TODO ESTÁ CONFIGURADO CORRECTAMENTE!');
  console.log('='.repeat(50));
  console.log('\n🎉 Puedes loguearte con:');
  console.log('   📧 Email: test@linkify.com');
  console.log('   🔑 Password: password123\n');
}

verificar().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
