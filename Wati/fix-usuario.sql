-- ============================================
-- ACTUALIZAR USUARIO DE PRUEBA
-- ============================================
-- Ejecuta esto en Supabase SQL Editor

-- Actualizar test@linkify.com con limiteNumeros
UPDATE usuarios
SET limiteNumeros = 10
WHERE email = 'test@linkify.com';

-- Actualizar renzo@gmail.com también
UPDATE usuarios
SET limiteNumeros = 10
WHERE email = 'renzo@gmail.com';

-- Verificar
SELECT email, password, limiteNumeros, telefono
FROM usuarios
ORDER BY created_at DESC;
