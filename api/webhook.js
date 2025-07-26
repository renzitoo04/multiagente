import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  // Aceptamos solo POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const body = req.body;

    // Mostrar el webhook completo para debug
    console.log('📩 Webhook recibido:', JSON.stringify(body, null, 2));

    const eventType = body.type;
    const paymentStatus = body.data?.status;
    const payerEmail = body.data?.payer?.email;

    // Validar los datos clave
    if (eventType === 'payment.updated' && paymentStatus === 'approved' && payerEmail) {
      // Calcular nueva fecha (30 días desde hoy)
      const hoy = new Date();
      const nuevaFecha = new Date(hoy.setMonth(hoy.getMonth() + 1));
      const fechaFormateada = nuevaFecha.toISOString().split('T')[0];

      // Actualizar Supabase
      const { error } = await supabase
        .from('usuarios')
        .update({ suscripcion_valida_hasta: fechaFormateada })
        .eq('email', payerEmail);

      if (error) {
        console.error('❌ Error actualizando Supabase:', error);
        return res.status(500).json({ error: 'No se pudo actualizar Supabase' });
      }

      console.log(`✅ Suscripción actualizada para ${payerEmail} hasta ${fechaFormateada}`);
      return res.status(200).json({ message: 'Suscripción actualizada correctamente' });
    }

    // Si no es un pago aprobado o faltan datos, ignorar
    return res.status(200).json({ message: 'Evento ignorado o datos incompletos' });

  } catch (err) {
    console.error('❌ Error en webhook:', err);
    return res.status(500).json({ error: 'Error interno en el webhook' });
  }
}
