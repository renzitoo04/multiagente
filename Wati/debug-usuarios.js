// ============================================
// SCRIPT DE DEBUG - VER TODOS LOS USUARIOS
// ============================================
// Ejecuta: node debug-usuarios.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function debug() {
  console.log('🔍 Mostrando TODOS los usuarios en la base de datos...\n');

  try {
    // Obtener TODOS los usuarios
    const { data: usuarios, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }

    if (!usuarios || usuarios.length === 0) {
      console.log('⚠️  No hay usuarios en la base de datos\n');
      console.log('Ejecuta este SQL en Supabase:');
      console.log(`
INSERT INTO usuarios (email, password, telefono, limiteNumeros)
VALUES ('test@linkify.com', 'password123', '+5491165388118', 10);
      `);
      return;
    }

    console.log(`📊 Total de usuarios: ${usuarios.length}\n`);
    console.log('─'.repeat(80));

    usuarios.forEach((user, index) => {
      console.log(`\n👤 Usuario ${index + 1}:`);
      console.log(`   Email: "${user.email}"`);
      console.log(`   Password: "${user.password}"`);
      console.log(`   Teléfono: ${user.telefono || 'N/A'}`);
      console.log(`   Límite Números: ${user.limiteNumeros || 'N/A'}`);
      console.log(`   Facebook Pixel: ${user.facebook_pixel_id || 'No configurado'}`);
      console.log(`   Creado: ${user.created_at}`);

      // Verificar espacios o caracteres raros
      const emailLength = user.email.length;
      const emailTrimmed = user.email.trim().length;
      if (emailLength !== emailTrimmed) {
        console.log(`   ⚠️  Email tiene espacios (length: ${emailLength}, trimmed: ${emailTrimmed})`);
      }
    });

    console.log('\n' + '─'.repeat(80));

    // Buscar específicamente test@linkify.com
    console.log('\n🔍 Buscando "test@linkify.com" específicamente...');

    const { data: testUser, error: testError } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', 'test@linkify.com')
      .single();

    if (testError || !testUser) {
      console.log('❌ NO encontrado con .eq("email", "test@linkify.com")');

      // Intentar con LIKE
      const { data: likeUsers, error: likeError } = await supabase
        .from('usuarios')
        .select('*')
        .ilike('email', '%test@linkify%');

      if (likeUsers && likeUsers.length > 0) {
        console.log(`✅ Encontrado ${likeUsers.length} con LIKE "%test@linkify%":`);
        likeUsers.forEach(u => {
          console.log(`   - "${u.email}" (length: ${u.email.length})`);
        });
      }
    } else {
      console.log('✅ Encontrado:');
      console.log(`   Email: "${testUser.email}"`);
      console.log(`   Password: "${testUser.password}"`);
      console.log('\n🎉 El usuario existe! Deberías poder loguearte con:');
      console.log('   📧 Email: test@linkify.com');
      console.log('   🔑 Password: password123\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debug();
