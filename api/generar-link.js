import mercadopago from 'mercadopago';
import dotenv from 'dotenv';
dotenv.config();

mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { plan } = req.body;

  const precios = {
    plan_2_numeros: 6,
    plan_3_numeros: 9,
    plan_4_numeros: 12,
    // Agrega más planes según sea necesario
  };

  if (!plan || !precios[plan]) {
    return res.status(400).json({ error: 'Plan inválido.' });
  }

  try {
    const preference = {
      items: [
        {
          title: `Suscripción ${plan}`,
          quantity: 1,
          currency_id: 'USD',
          unit_price: precios[plan],
        },
      ],
      back_urls: {
        success: `${req.headers.origin || 'http://localhost:3000'}/panel`,
        failure: `${req.headers.origin || 'http://localhost:3000'}/panel`,
        pending: `${req.headers.origin || 'http://localhost:3000'}/panel`,
      },
      auto_return: 'approved',
    };

    const response = await mercadopago.preferences.create(preference);
    return res.status(200).json({ init_point: response.body.init_point });
  } catch (error) {
    console.error('Error al crear la preferencia de pago:', error);
    return res.status(500).json({ error: 'No se pudo generar el link de pago.' });
  }
}