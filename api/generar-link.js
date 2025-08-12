import mercadopago from 'mercadopago';
import dotenv from 'dotenv';

dotenv.config();

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { plan, email } = req.body; // ahora recibimos email del cliente

    if (!plan) {
      return res.status(400).json({ error: 'Plan requerido' });
    }

    const preference = {
      items: [
        {
          title: `Suscripción ${plan}`,
          quantity: 1,
          currency_id: 'USD',
          unit_price: plan === 'plan_2_numeros' ? 6 : 10 // ejemplo
        }
      ],
      external_reference: plan, // 🔹 MUY IMPORTANTE
      payer: {
        email: email || '' // opcional, pero ayuda mucho
      },
      back_urls: {
        success: 'https://www.linkify.com.ar/success',
        failure: 'https://www.linkify.com.ar/failure',
        pending: 'https://www.linkify.com.ar/pending'
      },
      auto_return: 'approved',
      notification_url: 'https://www.linkify.com.ar/api/webhook' // tu webhook
    };

    const response = await mercadopago.preferences.create(preference);
    return res.status(200).json({ init_point: response.body.init_point });

  } catch (err) {
    console.error('❌ Error generando link de pago:', err);
    return res.status(500).json({ error: 'Error interno' });
  }
}
