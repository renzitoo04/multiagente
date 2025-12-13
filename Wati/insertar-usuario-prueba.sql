-- ============================================
-- INSERTAR SOLO USUARIO DE PRUEBA
-- ============================================
-- Ejecuta este script en Supabase SQL Editor

-- Insertar usuario de prueba
INSERT INTO usuarios (email, password, telefono, limiteNumeros)
VALUES (
  'test@linkify.com',
  'password123',
  '+5491165388118',
  10
)
ON CONFLICT (email) DO UPDATE
SET password = 'password123', limiteNumeros = 10;

-- Verificar que se creó
SELECT
  email,
  limiteNumeros,
  telefono,
  created_at
FROM usuarios
WHERE email = 'test@linkify.com';

-- ============================================
-- ✅ CREDENCIALES PARA LOGIN:
-- ============================================
-- Email: test@linkify.com
-- Password: password123
-- ============================================
