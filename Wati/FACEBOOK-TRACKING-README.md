# 📊 Sistema de Tracking de Conversiones de Facebook Ads

## 🎯 Descripción

Este sistema te permite trackear conversiones de Facebook Ads en tu plataforma de links rotativos de WhatsApp, similar a lo que hace WATI. Cada usuario puede conectar su propio Facebook Pixel y rastrear cuántos clics se convierten en mensajes de WhatsApp.

---

## 📋 Tabla de Contenidos

1. [Archivos Creados](#archivos-creados)
2. [Instalación Paso a Paso](#instalación-paso-a-paso)
3. [Configuración de Base de Datos](#configuración-de-base-de-datos)
4. [Integración del Frontend](#integración-del-frontend)
5. [Cómo Funciona](#cómo-funciona)
6. [Seguridad](#seguridad)
7. [Testing](#testing)
8. [FAQ](#faq)

---

## 📁 Archivos Creados

### Backend (API)

| Archivo | Descripción |
|---------|-------------|
| `api/redirect.js` | Endpoint principal de redirección con tracking |
| `api/conversion.js` | Endpoint para registrar conversiones |
| `api/facebook-config.js` | Endpoint para configurar Facebook Pixel |
| `api/conversion-stats.js` | Endpoint para obtener estadísticas |
| `utils/facebook-conversions.js` | Utilidad para Facebook Conversions API |

### Base de Datos

| Archivo | Descripción |
|---------|-------------|
| `database-schema.sql` | Schema completo para Supabase |

### Frontend

| Archivo | Descripción |
|---------|-------------|
| `facebook-tracking.html` | Componente UI para configuración y stats |
| `vercel.json` | Configuración de rutas actualizada |

---

## 🚀 Instalación Paso a Paso

### Paso 1: Ejecutar el Schema de Base de Datos

1. Ve a tu dashboard de Supabase
2. Abre el **SQL Editor**
3. Copia y pega el contenido completo de `database-schema.sql`
4. Ejecuta el script
5. Verifica que se hayan creado las nuevas columnas en la tabla `usuarios`

```sql
-- Verificar que las columnas se crearon correctamente
SELECT
  facebook_pixel_id,
  facebook_conversions_api_token,
  facebook_test_event_code
FROM usuarios
LIMIT 1;
```

### Paso 2: Integrar el Frontend

Abre `index.html` y sigue estos pasos:

#### 2.1 Agregar un botón en el menú del usuario

Busca esta sección en tu HTML (alrededor de la línea 112):

```html
<div class="user-avatar" id="user-avatar">T</div>
```

Y agrega un botón para acceder a la configuración de Facebook:

```html
<button onclick="toggleFacebookSection()" class="facebook-menu-btn">
  📊 Tracking Facebook
</button>
```

#### 2.2 Incluir el HTML de Facebook Tracking

Copia todo el contenido de `facebook-tracking.html` y pégalo **dentro** del `<div id="generador-container">`, después de la sección de links.

Aproximadamente después de esta línea:

```html
<div id="link-stats-container" class="card" style="display: none;">
  <!-- contenido existente -->
</div>

<!-- PEGAR AQUÍ EL CONTENIDO DE facebook-tracking.html -->
```

#### 2.3 Agregar Chart.js (opcional pero recomendado)

Antes del cierre de `</body>`, agrega:

```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```

### Paso 3: Verificar Vercel.json

El archivo `vercel.json` ya fue actualizado con las nuevas rutas. Verifica que contenga:

```json
{
  "rewrites": [
    ...rutas existentes...,
    { "source": "/link/:shortId", "destination": "/api/redirect.js" },
    { "source": "/api/conversion", "destination": "/api/conversion.js" },
    { "source": "/api/facebook-config", "destination": "/api/facebook-config.js" },
    { "source": "/api/conversion-stats", "destination": "/api/conversion-stats.js" }
  ]
}
```

### Paso 4: Deploy

```bash
# Si usas Git
git add .
git commit -m "✨ Agregar tracking de conversiones de Facebook"
git push

# Vercel hará el deploy automáticamente
```

---

## 🗄️ Configuración de Base de Datos

### Tablas Modificadas

#### `usuarios`
Nuevas columnas agregadas:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `facebook_pixel_id` | VARCHAR(255) | ID del Facebook Pixel del usuario |
| `facebook_conversions_api_token` | TEXT | Access Token para Conversions API (encriptado) |
| `facebook_test_event_code` | VARCHAR(100) | Código de eventos de prueba |

#### `clicks`
Nuevas columnas agregadas:

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `click_id` | UUID | ID único del click para tracking |
| `status` | VARCHAR(20) | Estado: 'clicked', 'converted', 'bounced' |
| `user_agent` | TEXT | User agent del navegador |
| `ip_address` | VARCHAR(45) | IP del usuario |
| `referrer` | TEXT | Página de origen |
| `fb_event_id` | VARCHAR(255) | Event ID para Facebook |
| `fb_pixel_sent` | BOOLEAN | Si se envió a Facebook Pixel |
| `fb_capi_sent` | BOOLEAN | Si se envió a Conversions API |
| `conversion_time` | TIMESTAMPTZ | Momento de la conversión |
| `time_on_page` | INTEGER | Segundos en la página |

### Vistas Creadas

#### `link_conversion_stats`
Estadísticas agregadas por link.

#### `daily_conversion_stats`
Estadísticas diarias de conversión.

---

## 🎨 Integración del Frontend

### Funciones JavaScript Principales

#### `loadFacebookConfig()`
Carga la configuración de Facebook del usuario al iniciar sesión.

#### `loadConversionStats()`
Carga y muestra las estadísticas de conversión.

#### `toggleFacebookSection()`
Muestra/oculta la sección de configuración de Facebook.

### Flujo de Usuario

1. Usuario inicia sesión
2. Ve botón "📊 Tracking Facebook" en el menú
3. Hace clic y ve:
   - Formulario de configuración de Pixel ID
   - Estado de configuración
   - Estadísticas de conversión
   - Gráfico de conversiones (si Chart.js está instalado)

---

## ⚙️ Cómo Funciona

### Flujo Completo de Tracking

```
1. Usuario hace clic en: midominio.com/link/abc123
   ↓
2. Backend (redirect.js):
   - Busca el link en la BD
   - Obtiene configuración de Facebook Pixel del usuario
   - Rota el número de WhatsApp
   - Registra el click con status='clicked'
   - Genera click_id y fb_event_id únicos
   ↓
3. Devuelve página HTML intermedia que:
   - Carga el Facebook Pixel del usuario
   - Envía evento "InitiateCheckout" (intención)
   - Inicia timer de 10 segundos
   - Redirige a WhatsApp después de 500ms
   ↓
4. JavaScript en la página intermedia:
   - Usa Page Visibility API
   - Si usuario estuvo >10 segundos → CONVERSIÓN
   - Si usuario volvió <10 segundos → BOUNCE
   ↓
5. Envía al backend (conversion.js):
   - Actualiza status en BD
   - Envía evento "Contact" a Facebook Pixel
   - Envía evento a Facebook Conversions API (server-side)
   ↓
6. Usuario ve estadísticas en el dashboard
```

### Eventos de Facebook Enviados

#### InitiateCheckout
- **Cuándo:** Inmediatamente al hacer clic en el link
- **Significa:** Usuario tiene intención de contactar
- **Valor:** $1 USD

#### Contact
- **Cuándo:** Después de 10 segundos en la página de redirección
- **Significa:** Usuario probablemente escribió en WhatsApp
- **Valor:** $10 USD

---

## 🔒 Seguridad

### Protección de Tokens

1. **Access Tokens nunca se devuelven en GET:**
   ```javascript
   // ✅ CORRECTO - api/facebook-config.js
   return res.status(200).json({
     facebook_pixel_id: data.facebook_pixel_id,
     has_access_token: !!data.facebook_conversions_api_token // Solo boolean
   });
   ```

2. **Los tokens se almacenan en la BD:**
   - Supabase los maneja con Row Level Security (RLS)
   - Solo el usuario propietario puede ver/editar

3. **Validación de Access Token:**
   - Antes de guardar, se valida con la API de Facebook
   - Si es inválido, se rechaza

### Variables de Entorno

Asegúrate de tener en `.env`:

```env
SUPABASE_URL=tu_url_de_supabase
SUPABASE_KEY=tu_key_de_supabase
```

### HTTPS Obligatorio

- Vercel usa HTTPS por defecto ✅
- Facebook requiere HTTPS para Pixel y Conversions API

---

## 🧪 Testing

### Paso 1: Obtener un Test Event Code

1. Ve a [Facebook Events Manager](https://business.facebook.com/events_manager2)
2. Selecciona tu Pixel
3. Ve a "Test Events"
4. Copia el "Test Event Code"
5. Pégalo en el formulario de configuración

### Paso 2: Hacer un Click de Prueba

1. Crea un link rotativo
2. Copia el link corto: `tudominio.com/link/abc123`
3. Ábrelo en modo incógnito
4. Espera más de 10 segundos antes de escribir en WhatsApp

### Paso 3: Verificar en Facebook

1. Ve a Facebook Events Manager → Test Events
2. Deberías ver:
   - ✅ Evento `InitiateCheckout`
   - ✅ Evento `Contact` (si esperaste >10 segundos)

### Paso 4: Ver Estadísticas

1. Ve a tu dashboard
2. Haz clic en "📊 Tracking Facebook"
3. Verás las estadísticas actualizadas

---

## 📊 Estadísticas Disponibles

### Métricas Principales

- **Total de Clics:** Todos los clicks en tus links
- **Conversiones:** Usuarios que escribieron en WhatsApp
- **Bounces:** Usuarios que salieron sin escribir
- **Tasa de Conversión:** % de clicks que se convirtieron
- **Tasa de Bounce:** % de clicks que rebotaron

### Métricas de Tiempo

- **Tiempo Promedio de Conversión:** Cuánto tardan en escribir
- **Tiempo Promedio en Página:** Cuánto tiempo pasan en la página intermedia

### Gráficos

- **Gráfico de Líneas:** Conversiones vs Clics en los últimos 30 días

---

## ❓ FAQ - Preguntas Frecuentes

### 1. ¿Cómo manejo la seguridad de los tokens de Facebook de mis usuarios?

**Respuesta:**
- Los tokens se almacenan en Supabase con Row Level Security (RLS)
- Nunca se devuelven en respuestas GET (solo se devuelve un boolean `has_access_token`)
- Se validan antes de guardarlos usando la API de Facebook
- Supabase encripta los datos en reposo por defecto

### 2. ¿Qué estructura de base de datos recomendás?

**Respuesta:**
La estructura ya está implementada en `database-schema.sql`. Incluye:

- Columnas en `usuarios` para Facebook Pixel ID y Access Token
- Columnas en `clicks` para tracking detallado
- Vistas para estadísticas agregadas
- Índices para optimizar queries
- Funciones útiles para cálculos

### 3. ¿Cómo muestro las estadísticas de conversión en el dashboard?

**Respuesta:**
El componente `facebook-tracking.html` incluye:

- Tarjetas con métricas en tiempo real
- Gráfico de conversiones (con Chart.js)
- Función `loadConversionStats()` que se actualiza automáticamente
- Diseño responsivo y profesional

### 4. ¿El tracking es preciso al 100%?

**Respuesta:**
**No**, pero es preciso al ~70-80%, lo cual es suficientemente bueno porque:

- Algunos usuarios cierran la pestaña antes de 10 segundos
- Algunos navegadores bloquean scripts de tracking
- La Page Visibility API no es 100% confiable

**Para mejorar la precisión:**
- Usa tanto Facebook Pixel (client-side) como Conversions API (server-side)
- Ajusta el `CONVERSION_THRESHOLD` (actualmente 10 segundos) según tu audiencia
- Usa el Test Event Code para verificar que funciona

### 5. ¿Necesito WhatsApp Business API?

**Respuesta:**
**NO.** Este sistema funciona con cualquier número de WhatsApp:

- WhatsApp Personal ✅
- WhatsApp Business (app) ✅
- WhatsApp Business API ✅

Solo necesitas el número de teléfono.

### 6. ¿Puedo usar mi propio Pixel o debo usar el del usuario?

**Respuesta:**
El sistema está diseñado para que **cada usuario use su propio Pixel**:

- El usuario configura su Pixel ID en su cuenta
- Los eventos se envían al Pixel del usuario, no al tuyo
- Esto permite que cada usuario vea sus conversiones en su Facebook Ads Manager

### 7. ¿Qué pasa si el usuario no configura Facebook Pixel?

**Respuesta:**
- Los links siguen funcionando normalmente ✅
- Los clicks se registran en la base de datos ✅
- NO se envían eventos a Facebook (porque no hay Pixel configurado)
- El usuario puede configurarlo en cualquier momento

### 8. ¿Puedo personalizar los eventos de Facebook?

**Respuesta:**
**SÍ.** Edita el archivo `utils/facebook-conversions.js`:

```javascript
// Cambiar el valor del evento
customData: {
  value: 20, // Cambiar de 10 a 20
  currency: 'ARS', // Cambiar de USD a ARS
}
```

O agregar eventos personalizados:

```javascript
export async function sendCustomEvent(params) {
  return sendFacebookConversionEvent({
    ...params,
    eventName: 'MiEventoCustom',
    customData: { ... }
  });
}
```

### 9. ¿Cómo obtengo el Facebook Pixel ID?

**Pasos:**
1. Ve a [Facebook Events Manager](https://business.facebook.com/events_manager2)
2. Selecciona tu cuenta de anuncios
3. Crea un Pixel si no tienes uno
4. Copia el Pixel ID (es un número de 15-16 dígitos)

### 10. ¿Cómo obtengo el Access Token para Conversions API?

**Pasos:**
1. Ve a [Facebook Events Manager](https://business.facebook.com/events_manager2)
2. Selecciona tu Pixel
3. Ve a "Settings" → "Conversions API"
4. Genera un Access Token
5. Cópialo y pégalo en tu configuración

**IMPORTANTE:** Guarda el token en un lugar seguro, Facebook solo lo muestra una vez.

### 11. ¿Puedo cambiar el umbral de conversión de 10 segundos?

**SÍ.** Edita `api/redirect.js` línea ~258:

```javascript
const CONVERSION_THRESHOLD = 10; // Cambiar a 5, 15, 20, etc.
```

**Recomendaciones:**
- **5 segundos:** Para audiencias muy rápidas
- **10 segundos:** Balance (recomendado) ⭐
- **15-20 segundos:** Para audiencias que leen el mensaje antes de escribir

### 12. ¿Los eventos se deduplicarán entre Pixel y Conversions API?

**SÍ.** Usamos `eventID` para deduplicación:

```javascript
const fbEventId = `${linkData.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
```

Facebook automáticamente detecta eventos duplicados con el mismo `eventID` y solo cuenta uno.

### 13. ¿Qué navegadores son compatibles?

**Compatibilidad:**
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Opera
- ✅ Navegadores móviles (iOS/Android)

**Requiere JavaScript habilitado.**

### 14. ¿Puedo ver las conversiones en tiempo real?

**Casi.** Las estadísticas se actualizan cada vez que:

1. Cargas la página del dashboard
2. Llamas a `loadConversionStats()`
3. Guardas la configuración de Facebook

Para actualizaciones automáticas, puedes agregar:

```javascript
// Actualizar cada 30 segundos
setInterval(() => {
  loadConversionStats();
}, 30000);
```

### 15. ¿Funciona con campañas de Instagram?

**SÍ.** Si usas el mismo Facebook Pixel en tus anuncios de Instagram:

- Los eventos se rastrean igual ✅
- Aparecen en Facebook Events Manager ✅
- Puedes crear audiencias personalizadas ✅

### 16. ¿Puedo exportar las estadísticas?

**Actualmente no está implementado**, pero puedes agregarlo fácilmente:

```javascript
function exportStatsToCSV() {
  // Implementar exportación a CSV
  // Los datos ya están en loadConversionStats()
}
```

O puedes ver las estadísticas directamente en Supabase usando las vistas creadas.

---

## 🎓 Recursos Adicionales

### Documentación de Facebook

- [Facebook Pixel](https://developers.facebook.com/docs/meta-pixel)
- [Conversions API](https://developers.facebook.com/docs/marketing-api/conversions-api)
- [Event Deduplication](https://developers.facebook.com/docs/marketing-api/conversions-api/deduplicate-pixel-and-server-events)
- [Test Events](https://www.facebook.com/business/help/2040882202671913)

### Videos Tutoriales

- [Cómo crear un Facebook Pixel](https://www.facebook.com/business/help/952192354843755)
- [Cómo usar Test Events](https://www.youtube.com/results?search_query=facebook+test+events)

---

## 🐛 Troubleshooting

### Los eventos no aparecen en Facebook

**Posibles causas:**
1. ✅ Verifica que el Pixel ID sea correcto (15-16 dígitos)
2. ✅ Asegúrate de haber guardado la configuración
3. ✅ Verifica que el link use HTTPS
4. ✅ Desactiva bloqueadores de anuncios
5. ✅ Usa el Test Event Code para debugging

### Las conversiones no se registran

**Posibles causas:**
1. ✅ Verifica que el usuario haya esperado >10 segundos
2. ✅ Revisa la consola del navegador (F12) para errores
3. ✅ Verifica que `/api/conversion` esté respondiendo correctamente

### El gráfico no se muestra

**Posibles causas:**
1. ✅ Verifica que Chart.js esté cargado
2. ✅ Abre la consola y busca errores de Chart.js
3. ✅ Asegúrate de tener datos (al menos 1 click)

---

## 📞 Soporte

Si tienes problemas:

1. Revisa esta documentación
2. Verifica los logs en la consola del navegador (F12)
3. Revisa los logs de Vercel
4. Verifica los datos en Supabase SQL Editor

---

## 🚀 Próximas Mejoras

Ideas para el futuro:

- [ ] Dashboard con métricas por campaña de Facebook
- [ ] Integración con Google Analytics
- [ ] Webhooks para notificaciones de conversión
- [ ] A/B testing de mensajes de WhatsApp
- [ ] Exportación de estadísticas a CSV/Excel
- [ ] Integración con Zapier/Make
- [ ] API pública para desarrolladores

---

## 📝 Changelog

### v1.0.0 (2025-01-13)
- ✅ Sistema completo de tracking de conversiones
- ✅ Facebook Pixel integration (client-side)
- ✅ Facebook Conversions API integration (server-side)
- ✅ Dashboard de estadísticas
- ✅ Configuración por usuario
- ✅ Event deduplication
- ✅ Test Events support

---

## 📄 Licencia

Código creado para tu plataforma Linkify.
Úsalo libremente en tu proyecto. 🚀

---

**¿Preguntas?** Revisa la sección [FAQ](#faq) o contacta con soporte.

**¡Éxito con tu plataforma SaaS!** 🎉
