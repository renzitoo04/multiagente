import { createClient } from '@supabase/supabase-js';
import mercadopago from 'mercadopago';
import dotenv from 'dotenv';

dotenv.config();

mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

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
    const externalReference = body.data?.external_reference;

    // Validar los datos clave
    if (eventType === 'payment.updated' && paymentStatus === 'approved' && payerEmail && externalReference) {
      // Mapeo de planes
      const planMap = {
        plan_2_numeros: 2,
        plan_3_numeros: 3,
        plan_4_numeros: 4,
        plan_5_numeros: 5,
        plan_20_numeros: 20,
      };

      const limiteNumeros = planMap[externalReference];
      if (!limiteNumeros) {
        return res.status(400).json({ error: 'Referencia externa inválida.' });
      }

      // Calcular nueva fecha (30 días desde hoy)
      const hoy = new Date();
      const nuevaFecha = new Date(hoy.setMonth(hoy.getMonth() + 1));
      const fechaFormateada = nuevaFecha.toISOString().split('T')[0];

      // Actualizar Supabase
      const { data: usuario, error: errorUsuario } = await supabase
        .from('usuarios')
        .select('email')
        .eq('email', payerEmail)
        .single();

      if (errorUsuario || !usuario) {
        console.error('❌ Usuario no encontrado:', errorUsuario);
        return res.status(404).json({ error: 'Usuario no encontrado.' });
      }

      const { error: errorUpdate } = await supabase
        .from('usuarios')
        .update({ limiteNumeros, suscripcion_valida_hasta: fechaFormateada })
        .eq('email', payerEmail);

      if (errorUpdate) {
        console.error('❌ Error actualizando Supabase:', errorUpdate);
        return res.status(500).json({ error: 'No se pudo actualizar Supabase.' });
      }

      console.log(`✅ Usuario actualizado: ${payerEmail}, limiteNumeros: ${limiteNumeros}, suscripcion_valida_hasta: ${fechaFormateada}`);
      return res.status(200).json({ success: true });
    }

    // Si no es un pago aprobado o faltan datos, ignorar
    return res.status(200).json({ message: 'Evento ignorado o datos incompletos.' });

  } catch (err) {
    console.error('❌ Error en webhook:', err);
    return res.status(500).json({ error: 'Error interno en el webhook.' });
  }
}
