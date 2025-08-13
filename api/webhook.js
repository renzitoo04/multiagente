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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    console.log('Webhook recibido:', req.body);

    // Verificar si es un pago
    if (req.body.type !== 'payment') {
      return res.status(200).json({ message: 'Notificación no relacionada a pago' });
    }

    const paymentId = req.body.data.id;
    if (!paymentId) {
      return res.status(400).json({ error: 'No se envió ID de pago' });
    }

    // Consultar detalles del pago
   const payment = await new Payment(mp).get({ id: paymentId });
   const paymentInfo = payment.body;

    console.log('Detalles del pago:', payment);
    const paymentStatus = payment.status;
    const userEmail = payment.external_reference;
    const plan = payment.additional_info?.items?.[0]?.title || 'plan_desconocido';

    if (paymentStatus === 'approved') {
      console.log(`Pago aprobado para: ${userEmail}, Plan: ${plan}`);

      // Determinar el límite de números según el plan
      let numeroLimite = 1; // Default
      if (plan.includes('2 números')) numeroLimite = 2;
      if (plan.includes('3 números')) numeroLimite = 3;
      if (plan.includes('4 números')) numeroLimite = 4;

      // Actualizar en Supabase
      const { data, error } = await supabase
        .from('usuarios')
        .update({ 
          plan_activo: plan,
          limiteNuneros: numeroLimite,
          subscripcion_valida_hasta: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
        })
        .eq('email', userEmail)
        .select();

      if (error) {
        console.error('Error actualizando en Supabase:', error);
        return res.status(500).json({ error: 'Error al actualizar usuario' });
      }

      console.log('Usuario actualizado correctamente:', data);
    }

    return res.status(200).json({ message: 'Webhook procesado' });
  } catch (err) {
    console.error('Error procesando webhook:', err);
    return res.status(500).json({ error: 'Error interno en el webhook' });
  }
}