# 📡 Ejemplos de Uso de la API

Esta guía muestra ejemplos prácticos de cómo usar los endpoints de tracking de conversiones.

---

## 🔑 Endpoints Disponibles

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/link/:shortId` | Redirección con tracking |
| POST | `/api/conversion` | Registrar conversión |
| GET | `/api/facebook-config` | Obtener configuración |
| POST | `/api/facebook-config` | Guardar configuración |
| DELETE | `/api/facebook-config` | Eliminar configuración |
| GET | `/api/conversion-stats` | Obtener estadísticas |

---

## 1️⃣ Configurar Facebook Pixel

### Request

```javascript
const email = 'usuario@ejemplo.com';
const pixelId = '1234567890123456';
const accessToken = 'EAAxxxxxxxxxxxxxxxxxxxxxxx';

const response = await fetch(`/api/facebook-config?email=${encodeURIComponent(email)}`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    facebook_pixel_id: pixelId,
    facebook_conversions_api_token: accessToken,
    facebook_test_event_code: 'TEST12345' // Opcional
  })
});

const result = await response.json();
console.log(result);
```

### Response (200 OK)

```json
{
  "success": true,
  "message": "Configuración de Facebook guardada exitosamente",
  "facebook_pixel_id": "1234567890123456",
  "has_access_token": true,
  "token_info": {
    "app_id": "123456789",
    "expires_at": 1735689600
  }
}
```

### Response (400 Error)

```json
{
  "error": "El Facebook Pixel ID debe ser un número de 15-16 dígitos"
}
```

---

## 2️⃣ Obtener Configuración

### Request

```javascript
const email = 'usuario@ejemplo.com';

const response = await fetch(`/api/facebook-config?email=${encodeURIComponent(email)}`);
const config = await response.json();
console.log(config);
```

### Response

```json
{
  "facebook_pixel_id": "1234567890123456",
  "facebook_test_event_code": "TEST12345",
  "has_access_token": true
}
```

**NOTA:** El `access_token` nunca se devuelve por seguridad.

---

## 3️⃣ Eliminar Configuración

### Request

```javascript
const email = 'usuario@ejemplo.com';

const response = await fetch(`/api/facebook-config?email=${encodeURIComponent(email)}`, {
  method: 'DELETE'
});

const result = await response.json();
console.log(result);
```

### Response

```json
{
  "success": true,
  "message": "Configuración de Facebook eliminada exitosamente"
}
```

---

## 4️⃣ Registrar Conversión (Backend Internal)

**NOTA:** Este endpoint es llamado automáticamente por el JavaScript de la página intermedia.

### Request

```javascript
const response = await fetch('/api/conversion', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    click_id: 'abc123-def456-ghi789',
    status: 'converted', // o 'bounced'
    time_on_page: 15 // segundos
  }),
  keepalive: true
});

const result = await response.json();
console.log(result);
```

### Response

```json
{
  "success": true,
  "message": "Click marcado como converted",
  "click_id": "abc123-def456-ghi789",
  "status": "converted",
  "time_on_page": 15
}
```

---

## 5️⃣ Obtener Estadísticas

### Request Básico

```javascript
const email = 'usuario@ejemplo.com';

const response = await fetch(`/api/conversion-stats?email=${encodeURIComponent(email)}`);
const stats = await response.json();
console.log(stats);
```

### Request con Filtros

```javascript
const email = 'usuario@ejemplo.com';
const linkId = 123;
const days = 7; // últimos 7 días

const response = await fetch(
  `/api/conversion-stats?email=${encodeURIComponent(email)}&link_id=${linkId}&days=${days}`
);
const stats = await response.json();
console.log(stats);
```

### Response

```json
{
  "period_days": 30,
  "total_clicks": 150,
  "conversions": 120,
  "bounces": 25,
  "pending": 5,
  "conversion_rate": 80.0,
  "bounce_rate": 16.67,
  "avg_time_to_conversion_seconds": 45,
  "avg_time_on_page_seconds": 38,
  "daily_stats": [
    {
      "date": "2025-01-01",
      "clicks": 10,
      "conversions": 8,
      "bounces": 2,
      "pending": 0,
      "conversion_rate": "80.00"
    },
    {
      "date": "2025-01-02",
      "clicks": 15,
      "conversions": 12,
      "bounces": 3,
      "pending": 0,
      "conversion_rate": "80.00"
    }
  ],
  "link_breakdown": [
    {
      "link_id": 123,
      "link_code": "abc123",
      "clicks": 100,
      "conversions": 80,
      "bounces": 18,
      "pending": 2,
      "conversion_rate": "80.00"
    },
    {
      "link_id": 124,
      "link_code": "def456",
      "clicks": 50,
      "conversions": 40,
      "bounces": 7,
      "pending": 3,
      "conversion_rate": "80.00"
    }
  ],
  "generated_at": "2025-01-13T12:00:00.000Z"
}
```

---

## 6️⃣ Enviar Evento Custom a Facebook (Server-Side)

### Usando la Utilidad

```javascript
import { sendFacebookConversionEvent } from './utils/facebook-conversions.js';

const result = await sendFacebookConversionEvent({
  pixelId: '1234567890123456',
  accessToken: 'EAAxxxxxxxxxxxxxxxxxxxxxxx',
  eventName: 'Lead',
  eventId: 'unique-event-id-12345',
  eventSourceUrl: 'https://tudominio.com/link/abc123',
  userAgent: 'Mozilla/5.0...',
  ipAddress: '192.168.1.1',
  clickedAt: new Date().toISOString(),
  testEventCode: 'TEST12345', // Opcional
  customData: {
    content_name: 'WhatsApp Lead',
    value: 20,
    currency: 'USD'
  }
});

console.log(result);
```

### Response Success

```json
{
  "success": true,
  "eventsReceived": 1,
  "fbtrace_id": "AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxBxxxxC",
  "messages": []
}
```

### Response Error

```json
{
  "success": false,
  "error": "Invalid OAuth access token",
  "errorCode": 190,
  "errorType": "OAuthException",
  "fbtrace_id": "AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxBxxxxC"
}
```

---

## 7️⃣ Validar Access Token de Facebook

### Usando la Utilidad

```javascript
import { validateFacebookToken } from './utils/facebook-conversions.js';

const result = await validateFacebookToken('EAAxxxxxxxxxxxxxxxxxxxxxxx');
console.log(result);
```

### Response Válido

```json
{
  "valid": true,
  "appId": "123456789",
  "expiresAt": 1735689600,
  "scopes": ["ads_management", "business_management"]
}
```

### Response Inválido

```json
{
  "valid": false,
  "error": "Invalid OAuth access token"
}
```

---

## 8️⃣ Enviar Batch de Eventos

### Usar para enviar múltiples eventos a la vez

```javascript
import { sendFacebookConversionBatch } from './utils/facebook-conversions.js';

const events = [
  {
    event_name: 'Contact',
    event_time: Math.floor(Date.now() / 1000),
    event_id: 'event-1',
    event_source_url: 'https://tudominio.com/link/abc123',
    action_source: 'website',
    user_data: {
      client_ip_address: '192.168.1.1',
      client_user_agent: 'Mozilla/5.0...'
    },
    custom_data: {
      value: 10,
      currency: 'USD'
    }
  },
  {
    event_name: 'Contact',
    event_time: Math.floor(Date.now() / 1000),
    event_id: 'event-2',
    event_source_url: 'https://tudominio.com/link/def456',
    action_source: 'website',
    user_data: {
      client_ip_address: '192.168.1.2',
      client_user_agent: 'Mozilla/5.0...'
    },
    custom_data: {
      value: 10,
      currency: 'USD'
    }
  }
];

const result = await sendFacebookConversionBatch(
  '1234567890123456', // Pixel ID
  'EAAxxxxxxxxxxxxxxxxxxxxxxx', // Access Token
  events,
  'TEST12345' // Test Event Code (opcional)
);

console.log(result);
```

### Response

```json
{
  "success": true,
  "eventsReceived": 2,
  "fbtrace_id": "AxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxBxxxxC",
  "messages": []
}
```

---

## 9️⃣ Consultas Directas a Supabase

### Ver todos los clicks de un link

```sql
SELECT
  click_id,
  status,
  clicked_at,
  conversion_time,
  time_on_page,
  fb_pixel_sent,
  fb_capi_sent
FROM clicks
WHERE link_id = 123
ORDER BY clicked_at DESC
LIMIT 100;
```

### Ver estadísticas usando la vista

```sql
SELECT * FROM link_conversion_stats
WHERE user_email = 'usuario@ejemplo.com';
```

### Ver estadísticas diarias

```sql
SELECT * FROM daily_conversion_stats
WHERE user_email = 'usuario@ejemplo.com'
  AND date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY date DESC;
```

### Calcular tasa de conversión

```sql
SELECT get_conversion_rate(123) as conversion_rate;
-- Retorna: 80.00
```

---

## 🔟 Webhooks (Próximamente)

**Idea para futuro:** Recibir notificaciones cuando ocurre una conversión.

```javascript
// Ejemplo de webhook
POST https://tu-servidor.com/webhook

{
  "event": "conversion",
  "click_id": "abc123-def456-ghi789",
  "link_id": 123,
  "link_code": "abc123",
  "user_email": "usuario@ejemplo.com",
  "status": "converted",
  "time_on_page": 15,
  "timestamp": "2025-01-13T12:00:00.000Z"
}
```

---

## 📊 Ejemplos de Visualización

### Gráfico con Chart.js

```javascript
const stats = await fetch('/api/conversion-stats?email=user@example.com&days=7')
  .then(r => r.json());

const ctx = document.getElementById('myChart').getContext('2d');
const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: stats.daily_stats.map(d => d.date),
    datasets: [
      {
        label: 'Conversiones',
        data: stats.daily_stats.map(d => d.conversions),
        borderColor: '#25D366',
        backgroundColor: 'rgba(37, 211, 102, 0.1)'
      },
      {
        label: 'Bounces',
        data: stats.daily_stats.map(d => d.bounces),
        borderColor: '#ff6b6b',
        backgroundColor: 'rgba(255, 107, 107, 0.1)'
      }
    ]
  },
  options: {
    responsive: true,
    scales: {
      y: { beginAtZero: true }
    }
  }
});
```

---

## 🎯 Rate Limits

**Facebook Conversions API:**
- 1000 eventos por request (batch)
- Sin límite de requests por hora (pero sé razonable)

**Tu API:**
- No hay rate limits implementados actualmente
- Considera agregar rate limiting con Vercel Edge Config

---

## 🔒 Autenticación

**Actualmente:**
- Los endpoints usan `email` como identificador
- NO hay autenticación JWT implementada

**Para producción:**
- Considera agregar JWT tokens
- Valida que el usuario está logueado
- Usa middleware de autenticación

Ejemplo:

```javascript
// Middleware de autenticación
function requireAuth(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  // Validar token
  next();
}
```

---

## 📝 Notas Finales

- Todos los endpoints retornan JSON
- Errores siguen formato: `{ "error": "mensaje" }`
- Usa `try/catch` para manejar errores
- Los timestamps están en formato ISO 8601
- Las tasas de conversión están en porcentaje (0-100)

---

**¿Más ejemplos?** Revisa el código fuente de los endpoints en `/api`.
