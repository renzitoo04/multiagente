import mercadopago, { Payment } from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

// Configurar Mercado Pago
const mp = new mercadopago.MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_TOKEN
});

// Configurar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Webhook Mercado Pago
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    console.log('Webhook recibido:', req.body);

    const { type, data } = req.body;

    if (type === 'preapproval') {
      console.log('Suscripción creada:', data.id);
      // Podés guardar en Supabase que el usuario tiene una suscripción activa
      return res.status(200).json({ message: 'Preapproval procesado' });
    }

    if (type === 'authorized_payment') {
      console.log('Pago recurrente recibido:', data.id);

      // Consultar detalles del pago recurrente
      const payment = await new Payment(mp).get({ id: data.id });
      const status = payment.status;
      const userEmail = payment.external_reference;

      if (status === 'approved') {
        // Sumar 30 días a la suscripción
        const nuevaFecha = new Date();
        nuevaFecha.setDate(nuevaFecha.getDate() + 30);

        await supabase
          .from('usuarios')
          .update({
            suscripcion_valida_hasta: nuevaFecha.toISOString()
          })
          .eq('email', userEmail);

        console.log(`Suscripción extendida para ${userEmail}`);
      }

      return res.status(200).json({ message: 'Pago recurrente procesado' });
    }

    return res.status(200).json({ message: 'Evento ignorado' });
  } catch (err) {
    console.error('Error procesando webhook:', err);
    return res.status(500).json({ error: 'Error interno en el webhook' });
  }
}
