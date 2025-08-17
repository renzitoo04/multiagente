import dotenv from 'dotenv';
dotenv.config();

import mercadopago from 'mercadopago';

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_TOKEN
});

export default async function handler(req, res) {
  const plan = req.method === 'POST' ? req.body.plan : req.query.plan;
  const userEmail = req.method === 'POST' ? req.body.email : req.query.email;

  if (!plan || !userEmail) {
    return res.status(400).json({ error: 'Falta el parámetro "plan" o "email".' });
  }

  const planes = {
    plan_2_numeros: { title: 'Plan PRO - 2 números', price: 1500 },
    plan_3_numeros: { title: 'Plan PRO - 3 números', price: 2000 },
    plan_4_numeros: { title: 'Plan PRO - 4 números', price: 2500 },
  };

  const planInfo = planes[plan];

  if (!planInfo) {
    return res.status(400).json({ error: 'Plan no válido o no especificado.' });
  }

  try {
    const preapproval = await mercadopago.preapproval.create({
      body: {
        reason: planInfo.title,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: planInfo.price,
          currency_id: "ARS",
          start_date: new Date().toISOString(),
          end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
        },
        back_url: "https://www.linkify.com.ar/panel",
        payer_email: userEmail
      }
    });

    return res.status(200).json({ init_point: preapproval.response.init_point });
  } catch (err) {
    console.error('Error al crear suscripción:', err);
    return res.status(500).json({ error: 'Error al generar el link de suscripción', detalles: err.message });
  }
}
