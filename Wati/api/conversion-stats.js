// ============================================
// ENDPOINT DE ESTADÍSTICAS DE CONVERSIÓN
// ============================================
// Este endpoint devuelve estadísticas de conversión para el dashboard del usuario
// Ruta: GET /api/conversion-stats?email=xxx&link_id=xxx&days=30

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { email, link_id, days = '30' } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Falta el parámetro email' });
    }

    // Validar que el usuario existe
    const { data: userData, error: userError } = await supabase
      .from('usuarios')
      .select('email')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const nDays = Math.max(1, Math.min(parseInt(days, 10) || 30, 365));
    const fromDate = new Date();
    fromDate.setUTCHours(0, 0, 0, 0);
    fromDate.setUTCDate(fromDate.getUTCDate() - (nDays - 1));

    // Si se proporciona link_id, obtener stats de ese link específico
    // Si no, obtener stats de todos los links del usuario
    let query = supabase
      .from('clicks')
      .select(`
        id,
        link_id,
        status,
        clicked_at,
        conversion_time,
        time_on_page,
        link:link_id (
          id,
          link,
          email
        )
      `)
      .gte('clicked_at', fromDate.toISOString());

    if (link_id) {
      query = query.eq('link_id', link_id);
    } else {
      // Filtrar por email del usuario a través de la relación con la tabla link
      const { data: userLinks } = await supabase
        .from('link')
        .select('id')
        .eq('email', email);

      if (!userLinks || userLinks.length === 0) {
        return res.status(200).json({
          total_clicks: 0,
          conversions: 0,
          bounces: 0,
          pending: 0,
          conversion_rate: 0,
          bounce_rate: 0,
          daily_stats: [],
          link_breakdown: []
        });
      }

      const linkIds = userLinks.map(l => l.id);
      query = query.in('link_id', linkIds);
    }

    const { data: clicksData, error: clicksError } = await query;

    if (clicksError) {
      console.error('Error al obtener clicks:', clicksError);
      return res.status(500).json({ error: 'Error al obtener estadísticas' });
    }

    // Calcular métricas generales
    const totalClicks = clicksData.length;
    const conversions = clicksData.filter(c => c.status === 'converted').length;
    const bounces = clicksData.filter(c => c.status === 'bounced').length;
    const pending = clicksData.filter(c => c.status === 'clicked').length;

    const conversionRate = totalClicks > 0 ? ((conversions / totalClicks) * 100).toFixed(2) : 0;
    const bounceRate = totalClicks > 0 ? ((bounces / totalClicks) * 100).toFixed(2) : 0;

    // Calcular tiempo promedio de conversión (en segundos)
    const convertedClicks = clicksData.filter(c => c.status === 'converted' && c.conversion_time);
    const avgTimeToConversion = convertedClicks.length > 0
      ? convertedClicks.reduce((acc, click) => {
          const clickTime = new Date(click.clicked_at).getTime();
          const conversionTime = new Date(click.conversion_time).getTime();
          return acc + ((conversionTime - clickTime) / 1000);
        }, 0) / convertedClicks.length
      : 0;

    // Calcular tiempo promedio en página
    const clicksWithTimeOnPage = clicksData.filter(c => c.time_on_page);
    const avgTimeOnPage = clicksWithTimeOnPage.length > 0
      ? clicksWithTimeOnPage.reduce((acc, click) => acc + click.time_on_page, 0) / clicksWithTimeOnPage.length
      : 0;

    // Generar estadísticas diarias
    const dailyStats = {};
    const cursor = new Date(fromDate);
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    while (cursor <= today) {
      const key = cursor.toISOString().slice(0, 10);
      dailyStats[key] = {
        date: key,
        clicks: 0,
        conversions: 0,
        bounces: 0,
        pending: 0,
        conversion_rate: 0
      };
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    for (const click of clicksData) {
      const d = new Date(click.clicked_at);
      const key = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
        .toISOString().slice(0, 10);

      if (dailyStats[key]) {
        dailyStats[key].clicks++;
        if (click.status === 'converted') dailyStats[key].conversions++;
        if (click.status === 'bounced') dailyStats[key].bounces++;
        if (click.status === 'clicked') dailyStats[key].pending++;
      }
    }

    // Calcular conversion_rate para cada día
    Object.keys(dailyStats).forEach(key => {
      const day = dailyStats[key];
      day.conversion_rate = day.clicks > 0
        ? ((day.conversions / day.clicks) * 100).toFixed(2)
        : 0;
    });

    const dailyStatsArray = Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date));

    // Desglose por link (si no se filtró por link_id)
    const linkBreakdown = [];
    if (!link_id) {
      const linkGroups = {};

      for (const click of clicksData) {
        const linkId = click.link_id;
        if (!linkGroups[linkId]) {
          linkGroups[linkId] = {
            link_id: linkId,
            link_code: click.link?.link || 'unknown',
            clicks: 0,
            conversions: 0,
            bounces: 0,
            pending: 0,
            conversion_rate: 0
          };
        }

        linkGroups[linkId].clicks++;
        if (click.status === 'converted') linkGroups[linkId].conversions++;
        if (click.status === 'bounced') linkGroups[linkId].bounces++;
        if (click.status === 'clicked') linkGroups[linkId].pending++;
      }

      Object.values(linkGroups).forEach(link => {
        link.conversion_rate = link.clicks > 0
          ? ((link.conversions / link.clicks) * 100).toFixed(2)
          : 0;
        linkBreakdown.push(link);
      });

      // Ordenar por mayor número de clics
      linkBreakdown.sort((a, b) => b.clicks - a.clicks);
    }

    // Retornar todas las métricas
    return res.status(200).json({
      // Métricas generales
      period_days: nDays,
      total_clicks: totalClicks,
      conversions: conversions,
      bounces: bounces,
      pending: pending,
      conversion_rate: parseFloat(conversionRate),
      bounce_rate: parseFloat(bounceRate),

      // Métricas de tiempo
      avg_time_to_conversion_seconds: Math.round(avgTimeToConversion),
      avg_time_on_page_seconds: Math.round(avgTimeOnPage),

      // Estadísticas diarias
      daily_stats: dailyStatsArray,

      // Desglose por link (solo si no se filtró por link_id)
      link_breakdown: linkBreakdown,

      // Metadatos
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error en conversion-stats endpoint:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
