import mercadopago from 'mercadopago';
import { createClient } from '@supabase/supabase-js';

// Configurar Mercado Pago
mercadopago.configure({
  access_token: process.env.MERCADO_PAGO_TOKEN
});

// Configurar Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    console.log('Webhook recibido:', req.body);

    // Extraer ID del pago desde el webhook
    const paymentId = req.body?.data?.id;
    if (!paymentId) {
      return res.status(400).json({ error: 'No se envió ID de pago' });
    }

    // Consultar detalles del pago en Mercado Pago
    const payment = await mercadopago.payment.findById(paymentId);
    const data = payment.body;

    console.log('Detalles del pago:', data);

    const payerEmail = data.payer?.email;
    const paymentStatus = data.status;
    const externalReference = data.external_reference;

    // Validar estado de pago
    if (paymentStatus === 'approved') {
      console.log(`Pago aprobado para: ${payerEmail}`);

      // Actualizar en Supabase (ejemplo: activar suscripción)
      const { error } = await supabase
        .from('usuarios')
        .update({ activo: true }) // cambia esto a tu campo real
        .eq('email', payerEmail);

      if (error) {
        console.error('Error actualizando en Supabase:', error);
      } else {
        console.log('Usuario actualizado correctamente en Supabase');
      }
    } else {
      console.log(`Pago con estado: ${paymentStatus}`);
    }

    return res.status(200).json({ message: 'Webhook procesado correctamente' });
  } catch (err) {
    console.error('Error procesando webhook:', err);
    return res.status(500).json({ error: 'Error interno en el webhook' });
  }
}
