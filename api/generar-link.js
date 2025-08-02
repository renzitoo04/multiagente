import dotenv from 'dotenv';
dotenv.config();

import mercadopago from 'mercadopago';
import dotenv from 'dotenv';
dotenv.config();

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_TOKEN
});

export default async function handler(req, res) {
  const plan = req.method === 'POST' ? req.body.plan : req.query.plan;

  const planes = {
    plan_2_numeros: { title: 'Plan PRO - 2 números', price: 6 },
    plan_3_numeros: { title: 'Plan PRO - 3 números', price: 9 },
    plan_4_numeros: { title: 'Plan PRO - 4 números', price: 12 },
    // Agregá más planes si querés
  };

  const planInfo = planes[plan];

  if (!planInfo) {
    return res.status(400).json({ error: 'Plan no válido o no especificado.' });
  }

  try {
    const preference = {
      items: [
        {
          title: planInfo.title,
          quantity: 1,
          unit_price: planInfo.price
        }
      ],
      external_reference: plan,
      back_urls: {
        success: 'https://www.linkify.com.ar/panel',
        failure: 'https://www.linkify.com.ar/fallo',
        pending: 'https://www.linkify.com.ar/pendiente'
      },
      auto_return: 'approved'
    };

    const response = await mercadopago.preferences.create(preference);
    console.log('Link generado correctamente:', response.body.init_point);

    return res.status(200).json({ init_point: response.body.init_point });
  } catch (err) {
    console.error('Error al crear preferencia de Mercado Pago:', err);
    return res.status(500).json({ error: 'Error al generar el link de pago', detalles: err.message });
  }
}

