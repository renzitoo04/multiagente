// ============================================
// UTILIDAD PARA FACEBOOK CONVERSIONS API
// ============================================
// Esta utilidad maneja el envío de eventos a Facebook Conversions API (server-side)
// Documentación: https://developers.facebook.com/docs/marketing-api/conversions-api

import fetch from 'node-fetch';
import crypto from 'crypto';

/**
 * Función para enviar eventos a Facebook Conversions API
 *
 * @param {Object} params - Parámetros del evento
 * @param {string} params.pixelId - ID del Facebook Pixel
 * @param {string} params.accessToken - Access Token de Conversions API
 * @param {string} params.eventName - Nombre del evento (ej: 'Contact', 'Lead', 'Purchase')
 * @param {string} params.eventId - ID único del evento para deduplicación
 * @param {string} params.eventSourceUrl - URL donde ocurrió el evento
 * @param {string} params.userAgent - User agent del navegador
 * @param {string} params.ipAddress - IP del usuario
 * @param {string} params.clickedAt - Timestamp del click (ISO string)
 * @param {string} [params.testEventCode] - Código de prueba (opcional)
 * @param {Object} [params.customData] - Datos personalizados del evento
 * @returns {Promise<Object>} Resultado del envío
 */
export async function sendFacebookConversionEvent(params) {
  const {
    pixelId,
    accessToken,
    eventName,
    eventId,
    eventSourceUrl,
    userAgent,
    ipAddress,
    clickedAt,
    testEventCode,
    customData = {}
  } = params;

  // Validar parámetros obligatorios
  if (!pixelId || !accessToken || !eventName || !eventId) {
    return {
      success: false,
      error: 'Faltan parámetros obligatorios: pixelId, accessToken, eventName, eventId'
    };
  }

  try {
    // Hashear datos de usuario para privacidad (SHA-256)
    const hashedIp = ipAddress ? hashSHA256(ipAddress) : null;
    const hashedUserAgent = userAgent ? hashSHA256(userAgent) : null;

    // Construir el evento según las especificaciones de Facebook
    const eventTime = Math.floor(new Date(clickedAt).getTime() / 1000);

    const eventData = {
      event_name: eventName,
      event_time: eventTime,
      event_id: eventId,
      event_source_url: eventSourceUrl,
      action_source: 'website',
      user_data: {
        client_ip_address: ipAddress,
        client_user_agent: userAgent,
        // Facebook recomienda enviar datos hasheados también
        ...(hashedIp && { hashed_ip: hashedIp }),
        ...(hashedUserAgent && { hashed_user_agent: hashedUserAgent })
      },
      custom_data: customData
    };

    // Preparar el payload
    const payload = {
      data: [eventData]
    };

    // Si hay test_event_code, agregarlo
    if (testEventCode) {
      payload.test_event_code = testEventCode;
    }

    // URL del endpoint de Facebook Conversions API
    const url = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`;

    // Enviar la petición a Facebook
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok) {
      return {
        success: true,
        eventsReceived: result.events_received || 0,
        fbtrace_id: result.fbtrace_id,
        messages: result.messages || []
      };
    } else {
      return {
        success: false,
        error: result.error?.message || 'Error desconocido',
        errorCode: result.error?.code,
        errorType: result.error?.type,
        fbtrace_id: result.fbtrace_id
      };
    }

  } catch (error) {
    console.error('Error al enviar evento a Facebook Conversions API:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Función para hashear datos con SHA-256
 * Facebook requiere que algunos datos estén hasheados por privacidad
 *
 * @param {string} data - Dato a hashear
 * @returns {string} Hash en formato hexadecimal
 */
function hashSHA256(data) {
  if (!data) return null;

  return crypto
    .createHash('sha256')
    .update(data.toLowerCase().trim())
    .digest('hex');
}

/**
 * Función para validar el access token de Facebook
 *
 * @param {string} accessToken - Access Token a validar
 * @returns {Promise<Object>} Información del token
 */
export async function validateFacebookToken(accessToken) {
  try {
    const url = `https://graph.facebook.com/v21.0/debug_token?input_token=${accessToken}&access_token=${accessToken}`;

    const response = await fetch(url);
    const result = await response.json();

    if (response.ok && result.data) {
      return {
        valid: result.data.is_valid,
        appId: result.data.app_id,
        expiresAt: result.data.expires_at,
        scopes: result.data.scopes
      };
    } else {
      return {
        valid: false,
        error: result.error?.message || 'Token inválido'
      };
    }
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Función para enviar múltiples eventos en batch (hasta 1000 eventos)
 *
 * @param {string} pixelId - ID del Facebook Pixel
 * @param {string} accessToken - Access Token de Conversions API
 * @param {Array} events - Array de eventos a enviar
 * @param {string} [testEventCode] - Código de prueba (opcional)
 * @returns {Promise<Object>} Resultado del envío
 */
export async function sendFacebookConversionBatch(pixelId, accessToken, events, testEventCode = null) {
  if (!pixelId || !accessToken || !events || events.length === 0) {
    return {
      success: false,
      error: 'Faltan parámetros obligatorios o el array de eventos está vacío'
    };
  }

  // Facebook permite máximo 1000 eventos por request
  if (events.length > 1000) {
    return {
      success: false,
      error: 'Máximo 1000 eventos por batch'
    };
  }

  try {
    const payload = {
      data: events
    };

    if (testEventCode) {
      payload.test_event_code = testEventCode;
    }

    const url = `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${accessToken}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (response.ok) {
      return {
        success: true,
        eventsReceived: result.events_received || 0,
        fbtrace_id: result.fbtrace_id,
        messages: result.messages || []
      };
    } else {
      return {
        success: false,
        error: result.error?.message || 'Error desconocido',
        errorCode: result.error?.code,
        fbtrace_id: result.fbtrace_id
      };
    }

  } catch (error) {
    console.error('Error al enviar batch a Facebook Conversions API:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Función de ejemplo para enviar evento InitiateCheckout
 */
export async function sendInitiateCheckoutEvent(params) {
  return sendFacebookConversionEvent({
    ...params,
    eventName: 'InitiateCheckout',
    customData: {
      content_name: 'WhatsApp Link',
      content_category: 'Messaging',
      value: 1,
      currency: 'USD',
      ...params.customData
    }
  });
}

/**
 * Función de ejemplo para enviar evento Contact
 */
export async function sendContactEvent(params) {
  return sendFacebookConversionEvent({
    ...params,
    eventName: 'Contact',
    customData: {
      content_name: 'WhatsApp Conversion',
      content_category: 'Lead',
      value: 10,
      currency: 'USD',
      ...params.customData
    }
  });
}

/**
 * Función de ejemplo para enviar evento Lead
 */
export async function sendLeadEvent(params) {
  return sendFacebookConversionEvent({
    ...params,
    eventName: 'Lead',
    customData: {
      content_name: 'WhatsApp Lead',
      content_category: 'Lead Generation',
      value: 15,
      currency: 'USD',
      ...params.customData
    }
  });
}
