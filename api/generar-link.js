import dotenv from 'dotenv';
dotenv.config();

import { Preference } from 'mercadopago';

const preference = new Preference({ accessToken: process.env.MERCADO_PAGO_TOKEN });

export default async function handler(req, res) {
  const plan = req.method === 'POST' ? req.body.plan : req.query.plan;
  const userEmail = req.method === 'POST' ? req.body.email : req.query.email;
  
  if (!plan || !userEmail) {
    console.warn("❌ Faltan parámetros requeridos.");
    return res.status(400).json({ error: 'Falta el parámetro "plan" o "email".' });
  }

  const planes = {
    plan_2_numeros: { title: 'Plan PRO - 2 números', price: 6 },
    plan_3_numeros: { title: 'Plan PRO - 3 números', price: 9 },
    plan_4_numeros: { title: 'Plan PRO - 4 números', price: 12 },
  };

  const planInfo = planes[plan];

  if (!planInfo) {
    return res.status(400).json({ error: 'Plan no válido o no especificado.' });
  }

  try {
    const response = await preference.create({
      body: {
        items: [
          {
            title: planInfo.title,
            quantity: 1,
            unit_price: planInfo.price
          }
        ],
        external_reference: userEmail, // Usamos el email como referencia
        back_urls: {
          success: 'https://www.linkify.com.ar/panel',
          failure: 'https://www.linkify.com.ar/fallo',
          pending: 'https://www.linkify.com.ar/pendiente'
        },
        auto_return: 'approved',
        notification_url: 'https://www.linkify.com.ar/api/webhook' // Asegúrate de configurar esto
      }
    });

    return res.status(200).json({ init_point: response.init_point });
  } catch (err) {
    console.error('Error al crear preferencia de Mercado Pago:', err);
    return res.status(500).json({ error: 'Error al generar el link de pago', detalles: err.message });
  }
}
