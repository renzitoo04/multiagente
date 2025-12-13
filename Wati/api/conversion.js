// ============================================
// ENDPOINT PARA REGISTRAR CONVERSIONES
// ============================================
// Este endpoint recibe eventos de conversión del frontend
// y los registra en la base de datos + envía a Facebook Conversions API
// Ruta: POST /api/conversion

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { sendFacebookConversionEvent } from '../utils/facebook-conversions.js';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { click_id, status, time_on_page } = req.body;

    // Validar parámetros
    if (!click_id || !status) {
      return res.status(400).json({ error: 'Faltan parámetros requeridos: click_id y status' });
    }

    if (!['converted', 'bounced'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido. Debe ser "converted" o "bounced"' });
    }

    // 1. Buscar el click en la base de datos
    const { data: clickData, error: clickError } = await supabase
      .from('clicks')
      .select(`
        id,
        link_id,
        status,
        fb_event_id,
        user_agent,
        ip_address,
        clicked_at,
        link:link_id (
          email,
          id
        )
      `)
      .eq('click_id', click_id)
      .single();

    if (clickError || !clickData) {
      console.error('Error al buscar click:', clickError);
      return res.status(404).json({ error: 'Click no encontrado' });
    }

    // Verificar que el click no haya sido ya procesado
    if (clickData.status !== 'clicked') {
      return res.status(200).json({
        message: 'Click ya fue procesado previamente',
        current_status: clickData.status
      });
    }

    // 2. Actualizar el estado del click en la base de datos
    const updateData = {
      status: status,
      time_on_page: time_on_page,
      conversion_time: status === 'converted' ? new Date().toISOString() : null
    };

    const { error: updateError } = await supabase
      .from('clicks')
      .update(updateData)
      .eq('click_id', click_id);

    if (updateError) {
      console.error('Error al actualizar click:', updateError);
      return res.status(500).json({ error: 'Error al actualizar el click' });
    }

    // 3. Si es una conversión, enviar evento a Facebook Conversions API
    if (status === 'converted') {
      try {
        // Obtener configuración de Facebook del usuario
        const { data: userData, error: userError } = await supabase
          .from('usuarios')
          .select('facebook_pixel_id, facebook_conversions_api_token, facebook_test_event_code')
          .eq('email', clickData.link.email)
          .single();

        if (!userError && userData && userData.facebook_conversions_api_token) {
          // Enviar evento a Facebook Conversions API
          const fbResult = await sendFacebookConversionEvent({
            pixelId: userData.facebook_pixel_id,
            accessToken: userData.facebook_conversions_api_token,
            eventName: 'Contact',
            eventId: clickData.fb_event_id + '_contact',
            eventSourceUrl: req.headers['referer'] || req.headers['referrer'] || '',
            userAgent: clickData.user_agent,
            ipAddress: clickData.ip_address,
            clickedAt: clickData.clicked_at,
            testEventCode: userData.facebook_test_event_code,
            customData: {
              content_name: 'WhatsApp Conversion',
              content_category: 'Lead',
              value: 10,
              currency: 'USD'
            }
          });

          // Actualizar que se envió a Facebook CAPI
          if (fbResult.success) {
            await supabase
              .from('clicks')
              .update({ fb_capi_sent: true })
              .eq('click_id', click_id);

            console.log('✅ Conversión enviada a Facebook CAPI:', fbResult);
          } else {
            console.error('❌ Error al enviar a Facebook CAPI:', fbResult.error);
          }
        }
      } catch (fbError) {
        console.error('Error al enviar a Facebook Conversions API:', fbError);
        // No retornar error al cliente, solo loguear
      }
    }

    return res.status(200).json({
      success: true,
      message: `Click marcado como ${status}`,
      click_id: click_id,
      status: status,
      time_on_page: time_on_page
    });

  } catch (error) {
    console.error('Error en conversion endpoint:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
