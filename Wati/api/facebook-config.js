// ============================================
// ENDPOINT DE CONFIGURACIÓN DE FACEBOOK PIXEL
// ============================================
// Este endpoint permite a los usuarios configurar su Facebook Pixel ID y Access Token
// Ruta: /api/facebook-config
// Métodos: GET (obtener), POST (guardar/actualizar)

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { validateFacebookToken } from '../utils/facebook-conversions.js';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Falta el parámetro email' });
  }

  // GET - Obtener configuración actual
  if (req.method === 'GET') {
    try {
      const { data: userData, error } = await supabase
        .from('usuarios')
        .select('facebook_pixel_id, facebook_test_event_code')
        .eq('email', email)
        .single();

      if (error || !userData) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Retornar solo el Pixel ID y Test Event Code (NO el access token por seguridad)
      return res.status(200).json({
        facebook_pixel_id: userData.facebook_pixel_id || null,
        facebook_test_event_code: userData.facebook_test_event_code || null,
        has_access_token: !!userData.facebook_conversions_api_token
      });

    } catch (error) {
      console.error('Error al obtener configuración:', error);
      return res.status(500).json({ error: 'Error al obtener la configuración' });
    }
  }

  // POST - Guardar/Actualizar configuración
  if (req.method === 'POST') {
    try {
      const {
        facebook_pixel_id,
        facebook_conversions_api_token,
        facebook_test_event_code
      } = req.body;

      // Validar que al menos se envíe el Pixel ID
      if (!facebook_pixel_id) {
        return res.status(400).json({
          error: 'El Facebook Pixel ID es obligatorio'
        });
      }

      // Validar formato del Pixel ID (solo números, 15-16 dígitos)
      if (!/^\d{15,16}$/.test(facebook_pixel_id)) {
        return res.status(400).json({
          error: 'El Facebook Pixel ID debe ser un número de 15-16 dígitos'
        });
      }

      // Si se proporciona un access token, validarlo (opcional pero recomendado)
      let tokenValidation = null;
      if (facebook_conversions_api_token) {
        tokenValidation = await validateFacebookToken(facebook_conversions_api_token);

        if (!tokenValidation.valid) {
          return res.status(400).json({
            error: 'El Access Token de Facebook no es válido',
            details: tokenValidation.error
          });
        }
      }

      // Preparar datos para actualizar
      const updateData = {
        facebook_pixel_id: facebook_pixel_id
      };

      // Solo actualizar el access token si se proporciona
      if (facebook_conversions_api_token) {
        updateData.facebook_conversions_api_token = facebook_conversions_api_token;
      }

      // Solo actualizar el test event code si se proporciona
      if (facebook_test_event_code) {
        updateData.facebook_test_event_code = facebook_test_event_code;
      }

      // Actualizar en la base de datos
      const { data, error } = await supabase
        .from('usuarios')
        .update(updateData)
        .eq('email', email)
        .select();

      if (error) {
        console.error('Error al actualizar configuración:', error);
        return res.status(500).json({
          error: 'Error al guardar la configuración',
          details: error.message
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Configuración de Facebook guardada exitosamente',
        facebook_pixel_id: facebook_pixel_id,
        has_access_token: !!facebook_conversions_api_token,
        token_info: tokenValidation ? {
          app_id: tokenValidation.appId,
          expires_at: tokenValidation.expiresAt
        } : null
      });

    } catch (error) {
      console.error('Error al guardar configuración:', error);
      return res.status(500).json({
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  // DELETE - Eliminar configuración
  if (req.method === 'DELETE') {
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({
          facebook_pixel_id: null,
          facebook_conversions_api_token: null,
          facebook_test_event_code: null
        })
        .eq('email', email);

      if (error) {
        return res.status(500).json({
          error: 'Error al eliminar la configuración'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Configuración de Facebook eliminada exitosamente'
      });

    } catch (error) {
      console.error('Error al eliminar configuración:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}
