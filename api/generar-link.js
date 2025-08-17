import mercadopago from "mercadopago";

mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_TOKEN, // tu access token de producción
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { email, plan } = req.body;

    // Definimos el monto según el plan elegido
    let amount = 0;
    let description = "";
    if (plan === "pro") {
      amount = 60; // ejemplo: $6000 ARS
      description = "Plan PRO - 2 números";
    } else if (plan === "basic") {
      amount = 3000;
      description = "Plan BASIC - 1 número";
    }

    // Crear la suscripción (preapproval)
    const subscription = await mercadopago.preapproval.create({
      body: {
        reason: description,
        auto_recurring: {
          frequency: 1, // cada 1 mes
          frequency_type: "months",
          transaction_amount: amount,
          currency_id: "ARS",
          start_date: new Date().toISOString(), // arranca ahora
          end_date: new Date(
            new Date().setFullYear(new Date().getFullYear() + 1) // dura 1 año
          ).toISOString(),
        },
        back_url: "https://www.linkify.com.ar/gracias", // adonde vuelve el usuario
        payer_email: email, // email del usuario
      },
    });

    return res.status(200).json({ url: subscription.body.init_point || subscription.body.sandbox_init_point || subscription.body.back_url, subscription });
  } catch (error) {
    console.error("Error al crear suscripción:", error);
    return res.status(500).json({ error: "Error al crear suscripción", details: error });
  }
}

