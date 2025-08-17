import MercadoPago from "mercadopago";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { email, plan } = req.body;

    // 🔑 Inicializar con tu access token de producción
    const client = new MercadoPago({
      accessToken: process.env.MERCADO_PAGO_TOKEN,
    });

    // Calcular fecha de finalización (ejemplo: 1 año)
    const date = new Date();
    date.setFullYear(date.getFullYear() + 1);

    // Crear suscripción (preapproval)
    const preapproval = await client.preapproval.create({
      body: {
        reason: plan,
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: 20, // 💲 importe mensual en ARS
          currency_id: "ARS",
          start_date: new Date().toISOString(),
          end_date: date.toISOString(),
        },
        back_url: "https://www.linkify.com.ar/panel", // redirección al volver
        payer_email: email,
      },
    });

    return res.status(200).json({ init_point: preapproval.init_point });
  } catch (error) {
    console.error("Error al crear suscripción:", error);
    return res.status(500).json({ error: "No se pudo crear la suscripción" });
  }
}
