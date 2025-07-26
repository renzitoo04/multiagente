import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });

  const event = req.body;

  console.log('📩 Webhook recibido:', event);

  // Asegurarse que sea un pago aprobado
  const paymentStatus = event.data?.status;
  const payerEmail = event.data?.payer?.email;

  if (event.type === 'payment.updated' && paymentStatus === 'approved' && payerEmail) {
    const nuevaFecha = new Date();
    nuevaFecha.setMonth(nuevaFecha.getMonth() + 1); // sumá 1 mes

    const { error } = await supabase
      .from('usuarios')
      .update({ suscripcion_valida_hasta: nuevaFecha.toISOString().split('T')[0] })
      .eq('email', payerEmail);

    if (error) {
      console.error('❌ Error al actualizar Supabase:', error);
      return res.status(500).json({ error: 'No se pudo actualizar la suscripción' });
    }

    console.log(`✅ Suscripción renovada para ${payerEmail} hasta ${nuevaFecha.toISOString().split('T')[0]}`);
    return res.status(200).json({ message: 'Suscripción actualizada' });
  }

  return res.status(200).json({ message: 'Evento ignorado' });
}
