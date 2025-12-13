# 🔐 Cómo Loguearse - Guía Rápida

Tienes **2 opciones** para loguearte:

---

## ✅ OPCIÓN 1: Usar Login Mock (MÁS RÁPIDO - 30 segundos)

**Sin configurar nada, listo para usar ahora mismo.**

### Paso 1: Cambiar una línea en vercel.json

Abre `vercel.json` y cambia esta línea:

**ANTES:**
```json
{ "source": "/api/login", "destination": "/api/login.js" },
```

**DESPUÉS:**
```json
{ "source": "/api/login", "destination": "/api/login-mock.js" },
```

### Paso 2: Deploy (si estás en Vercel)

```bash
git add .
git commit -m "🔧 Usar login mock"
git push
```

O si estás en local:
```bash
npm run dev
```

### Paso 3: Logueate con estas credenciales

Elige cualquiera de estas 3 cuentas:

**Opción A:**
```
Email: test@linkify.com
Password: password123
```

**Opción B:**
```
Email: admin@linkify.com
Password: admin123
```

**Opción C:**
```
Email: demo@linkify.com
Password: demo123
```

### ✅ Listo!

- Ve a tu sitio: `https://tu-dominio.vercel.app`
- Ingresa las credenciales
- Empieza a probar el sistema

**NOTA:** El login mock NO guarda datos en base de datos. Es solo para probar la interfaz.

---

## ✅ OPCIÓN 2: Configurar Supabase (COMPLETO - 2 minutos)

**Para tener base de datos real y probar TODO el sistema.**

### Paso 1: Ejecutar el Script SQL

1. **Abre Supabase:**
   - Ve a https://supabase.com/dashboard
   - Inicia sesión
   - Selecciona tu proyecto (el que está en tu `.env`)

2. **SQL Editor:**
   - Clic en "SQL Editor" en el menú izquierdo
   - Clic en "New Query"

3. **Ejecutar:**
   - Copia TODO el contenido de [setup-completo-supabase.sql](setup-completo-supabase.sql)
   - Pégalo en el editor
   - Clic en "Run" (o Ctrl+Enter)

4. **Verificar:**
   - Deberías ver "Success"
   - O un mensaje mostrando las tablas creadas

### Paso 2: Logueate

```
Email: test@linkify.com
Password: password123
```

### ✅ Listo!

Ahora tienes:
- ✅ Base de datos completa
- ✅ Usuario de prueba
- ✅ Link de prueba creado
- ✅ Tablas para tracking de Facebook
- ✅ Todo funcional

---

## 🆚 ¿Cuál elegir?

| Feature | Mock (Opción 1) | Supabase (Opción 2) |
|---------|-----------------|---------------------|
| **Tiempo de setup** | 30 segundos | 2 minutos |
| **Login funciona** | ✅ | ✅ |
| **Crear links** | ❌ | ✅ |
| **Ver estadísticas** | ❌ | ✅ |
| **Tracking Facebook** | ❌ | ✅ |
| **Guardar datos** | ❌ | ✅ |

### Recomendación:

- **Quieres ver solo el UI:** Usa Mock (Opción 1)
- **Quieres probar TODO:** Usa Supabase (Opción 2) ⭐

---

## 🔧 Cambiar entre Mock y Supabase

Es fácil cambiar entre ambos:

### Para usar MOCK:
```json
// vercel.json
{ "source": "/api/login", "destination": "/api/login-mock.js" }
```

### Para usar SUPABASE:
```json
// vercel.json
{ "source": "/api/login", "destination": "/api/login.js" }
```

---

## 🚨 Solución de Problemas

### "Usuario no encontrado" (Mock)
- Verifica que cambiaste `vercel.json`
- Hiciste deploy/restart del servidor
- Usas uno de los 3 emails listados

### "Usuario no encontrado" (Supabase)
- Ejecutaste [setup-completo-supabase.sql](setup-completo-supabase.sql)
- Usas el email correcto: `test@linkify.com`

### La página no carga
- Vercel está corriendo
- Abre consola del navegador (F12)
- Busca errores en Network tab

---

## 📝 Resumen Rápido

**Para empezar AHORA (30 segundos):**

1. Edita `vercel.json` línea 4:
   ```json
   { "source": "/api/login", "destination": "/api/login-mock.js" }
   ```

2. Deploy o restart

3. Login con:
   ```
   test@linkify.com / password123
   ```

**¡Listo!** 🎉

---

**Para sistema COMPLETO (2 minutos):**

1. Ejecuta [setup-completo-supabase.sql](setup-completo-supabase.sql) en Supabase

2. Login con:
   ```
   test@linkify.com / password123
   ```

**¡Listo para producción!** 🚀
