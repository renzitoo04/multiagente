-- ============================================
-- SCHEMA PARA TRACKING DE CONVERSIONES DE FACEBOOK
-- ============================================
-- Este archivo contiene todas las modificaciones necesarias para tu base de datos Supabase
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. Agregar columnas a la tabla 'usuarios' para Facebook Pixel y Conversions API
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS facebook_pixel_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS facebook_conversions_api_token TEXT,
ADD COLUMN IF NOT EXISTS facebook_test_event_code VARCHAR(100);

-- 2. Modificar la tabla 'clicks' para incluir información de conversión
ALTER TABLE clicks
ADD COLUMN IF NOT EXISTS click_id UUID DEFAULT gen_random_uuid() UNIQUE,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'clicked' CHECK (status IN ('clicked', 'converted', 'bounced')),
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS ip_address VARCHAR(45),
ADD COLUMN IF NOT EXISTS referrer TEXT,
ADD COLUMN IF NOT EXISTS fb_event_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS fb_pixel_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fb_capi_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS conversion_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS time_on_page INTEGER; -- Segundos que el usuario estuvo en la página

-- 3. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_clicks_link_id_status ON clicks(link_id, status);
CREATE INDEX IF NOT EXISTS idx_clicks_click_id ON clicks(click_id);
CREATE INDEX IF NOT EXISTS idx_clicks_clicked_at ON clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_usuarios_facebook_pixel ON usuarios(facebook_pixel_id) WHERE facebook_pixel_id IS NOT NULL;

-- 4. Crear vista para estadísticas de conversión por link
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
  MAX(c.clicked_at) as last_click,
  AVG(CASE WHEN c.conversion_time IS NOT NULL THEN
    EXTRACT(EPOCH FROM (c.conversion_time - c.clicked_at))
  END) as avg_time_to_conversion
FROM link l
LEFT JOIN clicks c ON l.id = c.link_id
GROUP BY l.id, l.email, l.link;

-- 5. Crear vista para estadísticas diarias
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

-- 6. Comentarios para documentación
COMMENT ON COLUMN usuarios.facebook_pixel_id IS 'ID del Facebook Pixel del usuario (ej: 1234567890123456)';
COMMENT ON COLUMN usuarios.facebook_conversions_api_token IS 'Access Token para Facebook Conversions API (encriptado)';
COMMENT ON COLUMN usuarios.facebook_test_event_code IS 'Código de eventos de prueba de Facebook para testing';
COMMENT ON COLUMN clicks.click_id IS 'ID único del click para tracking de conversión';
COMMENT ON COLUMN clicks.status IS 'Estado del click: clicked (inicial), converted (escribió en WhatsApp), bounced (salió sin escribir)';
COMMENT ON COLUMN clicks.fb_event_id IS 'Event ID único para deduplicación entre Pixel y Conversions API';
COMMENT ON COLUMN clicks.fb_pixel_sent IS 'Indica si el evento fue enviado exitosamente vía Facebook Pixel';
COMMENT ON COLUMN clicks.fb_capi_sent IS 'Indica si el evento fue enviado exitosamente vía Conversions API';
COMMENT ON COLUMN clicks.time_on_page IS 'Tiempo en segundos que el usuario permaneció en la página intermedia';

-- ============================================
-- POLÍTICAS DE SEGURIDAD (Row Level Security)
-- ============================================

-- Habilitar RLS en la tabla usuarios (si no está habilitado)
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Política para que los usuarios solo puedan ver/editar su propia configuración de Facebook
CREATE POLICY usuarios_facebook_config_policy ON usuarios
  FOR ALL
  USING (email = current_setting('request.jwt.claims', true)::json->>'email')
  WITH CHECK (email = current_setting('request.jwt.claims', true)::json->>'email');

-- ============================================
-- FUNCIONES ÚTILES
-- ============================================

-- Función para calcular tasa de conversión de un link
CREATE OR REPLACE FUNCTION get_conversion_rate(link_id_param INTEGER)
RETURNS DECIMAL AS $$
DECLARE
  total INTEGER;
  converted INTEGER;
BEGIN
  SELECT COUNT(*) INTO total FROM clicks WHERE link_id = link_id_param;
  SELECT COUNT(*) INTO converted FROM clicks WHERE link_id = link_id_param AND status = 'converted';

  IF total = 0 THEN
    RETURN 0;
  END IF;

  RETURN ROUND((converted::DECIMAL / total * 100), 2);
END;
$$ LANGUAGE plpgsql;

-- Función para limpiar clicks antiguos (opcional, para mantenimiento)
CREATE OR REPLACE FUNCTION cleanup_old_clicks(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM clicks
  WHERE clicked_at < NOW() - (days_to_keep || ' days')::INTERVAL
  AND status IN ('clicked', 'bounced');

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DATOS DE EJEMPLO (Opcional - solo para testing)
-- ============================================
-- Descomenta estas líneas si quieres datos de prueba

-- UPDATE usuarios
-- SET facebook_pixel_id = '1234567890123456',
--     facebook_test_event_code = 'TEST12345'
-- WHERE email = 'tu-email@ejemplo.com';
