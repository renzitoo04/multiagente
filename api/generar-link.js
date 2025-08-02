import mercadopago from 'mercadopago';

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN // Esto ya lo debés tener en tu .env
});

export default async function handler(req, res) {
  if (req.method === 'GET') {
    // Devolver la lista de planes disponibles
    return res.status(200).json({
      planes: {
        plan_2_numeros: { title: 'Plan PRO - 2 números', price: 6 },
        plan_3_numeros: { title: 'Plan PRO - 3 números', price: 9 },
        plan_4_numeros: { title: 'Plan PRO - 4 números', price: 12 },
        // Agregá más planes si querés
      }
    });
  }

  if (req.method === 'POST') {
    const { plan } = req.body;

    const planes = {
      plan_2_numeros: { title: 'Plan PRO - 2 números', price: 6 },
      plan_3_numeros: { title: 'Plan PRO - 3 números', price: 9 },
      plan_4_numeros: { title: 'Plan PRO - 4 números', price: 12 },
      // Agregá más si querés
    };

    const planInfo = planes[plan];
    if (!planInfo) {
      return res.status(400).json({ error: 'Plan no válido' });
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
        external_reference: plan, // 🔁 Esto lo usás en tu webhook
        back_urls: {
          success: 'https://www.linkify.com.ar/panel',
          failure: 'https://www.linkify.com.ar/fallo',
          pending: 'https://www.linkify.com.ar/pendiente'
        },
        auto_return: 'approved'
      };

      const response = await mercadopago.preferences.create(preference);
      return res.status(200).json({ init_point: response.body.init_point });
    } catch (err) {
      console.error('Error al crear preferencia:', err);
      return res.status(500).json({ error: 'Error al generar link de pago' });
    }
  }

  // Si el método no es GET ni POST
  return res.status(405).json({ error: 'Método no permitido' });
}
