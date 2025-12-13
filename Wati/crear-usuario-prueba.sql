-- ============================================
-- CREAR USUARIO DE PRUEBA PARA LOGIN
-- ============================================
-- Ejecuta este script en Supabase SQL Editor para crear un usuario de prueba

-- Insertar usuario de prueba
INSERT INTO usuarios (email, password, telefono, limiteNumeros, facebook_pixel_id, facebook_test_event_code)
VALUES (
  'test@linkify.com',           -- Email
  'password123',                 -- Contraseña (sin encriptar)
  '+5491165388118',             -- Teléfono
  5,                             -- Límite de números (puedes cambiar)
  NULL,                          -- Facebook Pixel (lo configurarás después)
  NULL                           -- Test Event Code (lo configurarás después)
)
ON CONFLICT (email) DO NOTHING; -- No insertar si ya existe

-- Verificar que se creó correctamente
SELECT
  email,
  limiteNumeros,
  telefono,
  created_at
FROM usuarios
WHERE email = 'test@linkify.com';

-- ============================================
-- CREDENCIALES PARA LOGIN
-- ============================================
-- Email: test@linkify.com
-- Password: password123
-- ============================================
