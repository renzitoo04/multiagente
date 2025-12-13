# 🚀 Guía Rápida de Inicio - 5 Minutos

## ✅ Checklist de Implementación

### 1️⃣ Base de Datos (2 minutos)

```sql
-- 1. Ve a Supabase SQL Editor
-- 2. Copia database-schema.sql
-- 3. Ejecuta
-- 4. ✅ Listo
```

**Verificar:**
```sql
SELECT COUNT(*) FROM usuarios WHERE facebook_pixel_id IS NOT NULL;
-- Debería funcionar sin errores
```

---

### 2️⃣ Frontend (2 minutos)

**Abrir `index.html` y hacer 2 cambios:**

#### Cambio 1: Agregar botón en el menú

Buscar (aprox. línea 112):
```html
<div class="user-avatar" id="user-avatar">T</div>
```

Agregar después:
```html
<button onclick="toggleFacebookSection()" style="margin-top: 10px; padding: 8px 15px; background: #1877f2; color: white; border: none; border-radius: 6px; cursor: pointer;">
  📊 Tracking Facebook
</button>
```

#### Cambio 2: Incluir componente de Facebook

Buscar (aprox. línea 180):
```html
<div id="link-stats-container" class="card" style="display: none;">
  <!-- contenido existente -->
</div>
```

Pegar **TODO** el contenido de `facebook-tracking.html` justo después.

#### Cambio 3: Agregar Chart.js (opcional)

Antes de `</body>`:
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```

---

### 3️⃣ Deploy (1 minuto)

```bash
git add .
git commit -m "✨ Facebook tracking"
git push
```

**O simplemente sube los archivos a Vercel.**

---

## 🧪 Testing Rápido

### Probar que funciona:

1. **Inicia sesión en tu plataforma**
2. **Clic en "📊 Tracking Facebook"**
3. **Llenar el formulario:**
   - Pixel ID: `1234567890123456` (tu Pixel ID real)
   - Access Token: (opcional)
   - Test Code: `TEST12345` (obtenerlo de Facebook)
4. **Guardar**
5. **Crear un link rotativo**
6. **Copiar el link corto:** `tudominio.com/link/abc123`
7. **Abrirlo en modo incógnito**
8. **Esperar 15 segundos**
9. **Ir a Facebook Test Events**
10. **Ver los eventos:**
    - ✅ InitiateCheckout
    - ✅ Contact

---

## 📊 Ver Estadísticas

1. Volver al dashboard
2. Clic en "📊 Tracking Facebook"
3. Ver:
   - Total Clics: 1
   - Conversiones: 1
   - Tasa: 100%

---

## 🎯 Siguiente Paso

### Configurar tu Facebook Pixel real:

1. Ve a [Facebook Events Manager](https://business.facebook.com/events_manager2)
2. Crea un Pixel si no tienes
3. Copia el Pixel ID
4. Pégalo en la configuración
5. **¡Listo!** Tus links ya están trackeando conversiones

---

## ❓ ¿Problemas?

### Los eventos no aparecen en Facebook

```javascript
// Verificar en la consola del navegador (F12)
// Deberías ver:
// ✅ InitiateCheckout enviado a Facebook Pixel
// ✅ Contact enviado a Facebook Pixel
// ✅ Conversión registrada en el backend
```

### El botón no aparece

- Verifica que pegaste el código en el lugar correcto
- Limpia la caché del navegador (Ctrl+Shift+R)
- Verifica que estés logueado

### Las estadísticas no se actualizan

- Actualiza la página
- Verifica que el click se registró en Supabase:
  ```sql
  SELECT * FROM clicks ORDER BY clicked_at DESC LIMIT 5;
  ```

---

## 📞 Soporte

**¿Necesitas ayuda?**

1. Lee [FACEBOOK-TRACKING-README.md](./FACEBOOK-TRACKING-README.md)
2. Revisa la sección [FAQ](./FACEBOOK-TRACKING-README.md#faq)
3. Verifica los logs en Vercel

---

## 🎉 ¡Felicidades!

**Ya tienes tracking de conversiones funcionando.**

Ahora puedes:
- ✅ Ver conversiones en Facebook Events Manager
- ✅ Crear audiencias personalizadas
- ✅ Optimizar tus campañas de Facebook Ads
- ✅ Ofrecer este servicio a tus usuarios

**¡Éxito con tu SaaS!** 🚀
