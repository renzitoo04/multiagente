-- ============================================
-- SETUP COMPLETO DE SUPABASE PARA LINKIFY
-- ============================================
-- Ejecuta este script COMPLETO en Supabase SQL Editor

-- 1. CREAR TABLA DE USUARIOS
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  telefono VARCHAR(50),
  limiteNumeros INTEGER DEFAULT 1,
  suscripcion_valida_hasta DATE,
  facebook_pixel_id VARCHAR(255),
  facebook_conversions_api_token TEXT,
  facebook_test_event_code VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREAR TABLA DE LINKS
CREATE TABLE IF NOT EXISTS link (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) REFERENCES usuarios(email) ON DELETE CASCADE,
  link VARCHAR(100) UNIQUE NOT NULL,
  numeros TEXT[], -- Array de números
  mensaje TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREAR TABLA DE CLICKS
CREATE TABLE IF NOT EXISTS clicks (
  id SERIAL PRIMARY KEY,
  link_id INTEGER REFERENCES link(id) ON DELETE CASCADE,
  clicked_at TIMESTAMPTZ DEFAULT NOW(),

  -- Columnas para tracking de Facebook
  click_id UUID DEFAULT gen_random_uuid() UNIQUE,
  status VARCHAR(20) DEFAULT 'clicked' CHECK (status IN ('clicked', 'converted', 'bounced')),
  user_agent TEXT,
  ip_address VARCHAR(45),
  referrer TEXT,
  fb_event_id VARCHAR(255),
  fb_pixel_sent BOOLEAN DEFAULT false,
  fb_capi_sent BOOLEAN DEFAULT false,
  conversion_time TIMESTAMPTZ,
  time_on_page INTEGER
);

-- 4. CREAR ÍNDICES
CREATE INDEX IF NOT EXISTS idx_clicks_link_id ON clicks(link_id);
CREATE INDEX IF NOT EXISTS idx_clicks_link_id_status ON clicks(link_id, status);
CREATE INDEX IF NOT EXISTS idx_clicks_click_id ON clicks(click_id);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_usuarios_facebook_pixel ON usuarios(facebook_pixel_id) WHERE facebook_pixel_id IS NOT NULL;

-- 5. CREAR VISTAS PARA ESTADÍSTICAS
CREATE OR REPLACE VIEW link_conversion_stats AS
SELECT
  l.id as link_id,
  l.email as user_email,
  l.link,
  COUNT(c.id) as total_clicks,
  COUNT(CASE WHEN c.status = 'converted' THEN 1 END) as conversions,
  COUNT(CASE WHEN c.status = 'bounced' THEN 1 END) as bounces,
  COUNT(CASE WHEN c.status = 'clicked' THEN 1 END) as pending,
  ROUND(
    (COUNT(CASE WHEN c.status = 'converted' THEN 1 END)::decimal /
    NULLIF(COUNT(c.id), 0) * 100), 2
  ) as conversion_rate,
  MAX(c.clicked_at) as last_click
FROM link l
LEFT JOIN clicks c ON l.id = c.link_id
GROUP BY l.id, l.email, l.link;

CREATE OR REPLACE VIEW daily_conversion_stats AS
SELECT
  l.id as link_id,
  l.email as user_email,
  DATE(c.clicked_at) as date,
  COUNT(c.id) as clicks,
  COUNT(CASE WHEN c.status = 'converted' THEN 1 END) as conversions,
  COUNT(CASE WHEN c.status = 'bounced' THEN 1 END) as bounces,
  ROUND(
    (COUNT(CASE WHEN c.status = 'converted' THEN 1 END)::decimal /
    NULLIF(COUNT(c.id), 0) * 100), 2
  ) as conversion_rate
FROM link l
LEFT JOIN clicks c ON l.id = c.link_id
WHERE c.clicked_at IS NOT NULL
GROUP BY l.id, l.email, DATE(c.clicked_at)
ORDER BY date DESC;

-- 6. INSERTAR USUARIO DE PRUEBA
INSERT INTO usuarios (email, password, telefono, limiteNumeros)
VALUES (
  'test@linkify.com',
  'password123',
  '+5491165388118',
  10
)
ON CONFLICT (email) DO UPDATE
SET password = 'password123', limiteNumeros = 10;

-- 7. INSERTAR LINK DE PRUEBA PARA EL USUARIO
INSERT INTO link (email, link, numeros, mensaje)
VALUES (
  'test@linkify.com',
  'test123',
  ARRAY['+5491165388118', '+5491123456789'],
  'Hola! Vi tu anuncio en Facebook'
)
ON CONFLICT (link) DO NOTHING;

-- 8. VERIFICAR QUE TODO SE CREÓ CORRECTAMENTE
SELECT 'USUARIOS:' as tabla, COUNT(*) as registros FROM usuarios
UNION ALL
SELECT 'LINKS:', COUNT(*) FROM link
UNION ALL
SELECT 'CLICKS:', COUNT(*) FROM clicks;

-- 9. MOSTRAR EL USUARIO DE PRUEBA
SELECT
  email,
  limiteNumeros,
  telefono,
  facebook_pixel_id,
  created_at
FROM usuarios
WHERE email = 'test@linkify.com';

-- ============================================
-- ✅ SETUP COMPLETADO
-- ============================================
-- CREDENCIALES PARA LOGIN:
-- Email: test@linkify.com
-- Password: password123
-- ============================================

-- PRÓXIMOS PASOS:
-- 1. Inicia sesión en tu app con las credenciales de arriba
-- 2. Configura tu Facebook Pixel ID en el dashboard
-- 3. Crea un link rotativo
-- 4. Prueba el tracking de conversiones
-- ============================================
