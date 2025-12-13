// ============================================
// ENDPOINT DE REDIRECCIÓN CON TRACKING DE FACEBOOK
// ============================================
// Este endpoint maneja la redirección de links rotativos con tracking de conversión
// Ruta: /link/:shortId

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    // Obtener el shortId desde la URL
    // La URL será: /link/abc123
    const shortId = req.url.split('/link/')[1]?.split('?')[0];

    if (!shortId) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Error - Linkify</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>❌ Link no válido</h1>
          <p>El link que intentas acceder no existe.</p>
        </body>
        </html>
      `);
    }

    // 1. Buscar el link en la base de datos
    const { data: linkData, error: linkError } = await supabase
      .from('link')
      .select('id, email, numeros, mensaje')
      .eq('link', shortId)
      .single();

    if (linkError || !linkData) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Error - Linkify</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>🔍 Link no encontrado</h1>
          <p>Este link no existe o ha sido eliminado.</p>
        </body>
        </html>
      `);
    }

    // 2. Obtener configuración de Facebook Pixel del usuario
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('facebook_pixel_id, facebook_test_event_code')
      .eq('email', linkData.email)
      .single();

    if (userError) {
      console.error('Error al obtener usuario:', userError);
    }

    // 3. Rotar número de WhatsApp
    const numeros = linkData.numeros || [];
    if (numeros.length === 0) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Error - Linkify</title></head>
        <body style="font-family: Arial; text-align: center; padding: 50px;">
          <h1>⚠️ Sin números configurados</h1>
          <p>Este link no tiene números de WhatsApp asignados.</p>
        </body>
        </html>
      `);
    }

    // Contar clicks totales del link para hacer rotación
    const { count } = await supabase
      .from('clicks')
      .select('*', { count: 'exact', head: true })
      .eq('link_id', linkData.id);

    const indice = (count || 0) % numeros.length;
    const numeroSeleccionado = numeros[indice];
    const mensaje = linkData.mensaje || '';

    // 4. Construir URL de WhatsApp
    const whatsappUrl = `https://wa.me/${numeroSeleccionado}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''}`;

    // 5. Generar click_id único y event_id para Facebook
    const clickId = crypto.randomUUID();
    const fbEventId = `${linkData.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // 6. Capturar información del usuario
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || req.connection?.remoteAddress || '';
    const referrer = req.headers['referer'] || req.headers['referrer'] || '';

    // 7. Registrar el click en la base de datos
    const { error: insertError } = await supabase
      .from('clicks')
      .insert({
        link_id: linkData.id,
        click_id: clickId,
        status: 'clicked',
        user_agent: userAgent,
        ip_address: ipAddress,
        referrer: referrer,
        fb_event_id: fbEventId,
        clicked_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Error al registrar click:', insertError);
    }

    // 8. Devolver página HTML intermedia con tracking de Facebook
    const pixelId = userData?.facebook_pixel_id || '';
    const testEventCode = userData?.facebook_test_event_code || '';

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(`
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Redirigiendo a WhatsApp...</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #25D366 0%, #128C7E 100%);
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      color: white;
    }
    .container {
      text-align: center;
      padding: 40px 20px;
      max-width: 500px;
    }
    .whatsapp-icon {
      font-size: 80px;
      margin-bottom: 20px;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    h1 {
      font-size: 28px;
      margin-bottom: 15px;
      font-weight: 600;
    }
    p {
      font-size: 16px;
      opacity: 0.9;
      line-height: 1.6;
    }
    .loader {
      margin: 30px auto;
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-top: 4px solid white;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>

  ${pixelId ? `
  <!-- Facebook Pixel Code -->
  <script>
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', '${pixelId}' ${testEventCode ? `, {external_id: '${clickId}'}` : ''});
    ${testEventCode ? `fbq('track', 'PageView', {}, {eventID: '${fbEventId}', test_event_code: '${testEventCode}'});` : `fbq('track', 'PageView', {}, {eventID: '${fbEventId}'});`}
  </script>
  <noscript>
    <img height="1" width="1" style="display:none"
    src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1"/>
  </noscript>
  <!-- End Facebook Pixel Code -->
  ` : ''}
</head>
<body>
  <div class="container">
    <div class="whatsapp-icon">📱</div>
    <h1>Redirigiendo a WhatsApp</h1>
    <p>Serás redirigido automáticamente en un momento...</p>
    <div class="loader"></div>
    <p style="font-size: 14px; margin-top: 20px; opacity: 0.7;">
      Si no eres redirigido automáticamente, <a href="${whatsappUrl}" style="color: white; text-decoration: underline;">haz clic aquí</a>
    </p>
  </div>

  <script>
    (function() {
      const CLICK_ID = '${clickId}';
      const FB_EVENT_ID = '${fbEventId}';
      const FB_PIXEL_ID = '${pixelId}';
      const TEST_EVENT_CODE = '${testEventCode}';
      const WHATSAPP_URL = '${whatsappUrl}';
      const CONVERSION_THRESHOLD = 10; // segundos para considerar conversión
      const REDIRECT_DELAY = 500; // milisegundos antes de redirigir

      let startTime = Date.now();
      let conversionSent = false;
      let hasRedirected = false;

      // Enviar evento InitiateCheckout inmediatamente
      if (typeof fbq !== 'undefined' && FB_PIXEL_ID) {
        const eventData = {
          content_name: 'WhatsApp Link',
          content_category: 'Messaging',
          value: 1,
          currency: 'USD'
        };

        const eventOptions = {
          eventID: FB_EVENT_ID + '_initiate'
        };

        if (TEST_EVENT_CODE) {
          eventOptions.test_event_code = TEST_EVENT_CODE;
        }

        fbq('track', 'InitiateCheckout', eventData, eventOptions);
        console.log('✅ InitiateCheckout enviado a Facebook Pixel');
      }

      // Función para enviar conversión
      function sendConversion() {
        if (conversionSent) return;
        conversionSent = true;

        const timeOnPage = Math.floor((Date.now() - startTime) / 1000);

        // Enviar evento Contact a Facebook Pixel
        if (typeof fbq !== 'undefined' && FB_PIXEL_ID) {
          const eventData = {
            content_name: 'WhatsApp Conversion',
            content_category: 'Lead',
            value: 10,
            currency: 'USD'
          };

          const eventOptions = {
            eventID: FB_EVENT_ID + '_contact'
          };

          if (TEST_EVENT_CODE) {
            eventOptions.test_event_code = TEST_EVENT_CODE;
          }

          fbq('track', 'Contact', eventData, eventOptions);
          console.log('✅ Contact enviado a Facebook Pixel');
        }

        // Enviar al backend para registrar conversión
        fetch('/api/conversion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            click_id: CLICK_ID,
            status: 'converted',
            time_on_page: timeOnPage
          }),
          keepalive: true // Importante: mantener la petición aunque se cierre la página
        }).then(response => {
          if (response.ok) {
            console.log('✅ Conversión registrada en el backend');
          }
        }).catch(err => {
          console.error('❌ Error al registrar conversión:', err);
        });
      }

      // Función para enviar bounce
      function sendBounce() {
        if (conversionSent) return;

        const timeOnPage = Math.floor((Date.now() - startTime) / 1000);

        fetch('/api/conversion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            click_id: CLICK_ID,
            status: 'bounced',
            time_on_page: timeOnPage
          }),
          keepalive: true
        }).catch(err => {
          console.error('❌ Error al registrar bounce:', err);
        });
      }

      // Detectar si el usuario está interactuando con WhatsApp
      let interactionTimer = setInterval(function() {
        const timeOnPage = Math.floor((Date.now() - startTime) / 1000);

        // Si pasó el umbral y la página sigue visible = usuario escribiendo
        if (timeOnPage >= CONVERSION_THRESHOLD && !document.hidden) {
          sendConversion();
          clearInterval(interactionTimer);
        }
      }, 1000);

      // Page Visibility API: detectar cuando el usuario vuelve a la pestaña
      document.addEventListener('visibilitychange', function() {
        const timeOnPage = Math.floor((Date.now() - startTime) / 1000);

        if (!document.hidden && timeOnPage >= CONVERSION_THRESHOLD) {
          // Usuario volvió después de estar en WhatsApp por más de 10 segundos
          sendConversion();
          clearInterval(interactionTimer);
        } else if (!document.hidden && timeOnPage < CONVERSION_THRESHOLD) {
          // Usuario volvió muy rápido = bounce
          sendBounce();
          clearInterval(interactionTimer);
        }
      });

      // Detectar cuando el usuario abandona la página definitivamente
      window.addEventListener('beforeunload', function() {
        const timeOnPage = Math.floor((Date.now() - startTime) / 1000);

        if (!conversionSent) {
          if (timeOnPage >= CONVERSION_THRESHOLD) {
            sendConversion();
          } else {
            sendBounce();
          }
        }
      });

      // Redirigir a WhatsApp después del delay
      setTimeout(function() {
        if (!hasRedirected) {
          hasRedirected = true;
          window.location.href = WHATSAPP_URL;
        }
      }, REDIRECT_DELAY);

    })();
  </script>
</body>
</html>
    `);

  } catch (error) {
    console.error('Error en redirect:', error);
    return res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Error - Linkify</title></head>
      <body style="font-family: Arial; text-align: center; padding: 50px;">
        <h1>⚠️ Error del servidor</h1>
        <p>Hubo un problema al procesar tu solicitud.</p>
      </body>
      </html>
    `);
  }
}
