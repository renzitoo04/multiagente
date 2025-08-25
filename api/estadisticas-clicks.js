// estadisticas-clicks.js
import express from "express";
import fetch from "node-fetch";

const router = express.Router();

// Token de TinyURL Premium (ya lo tenés en tus env)
const TINYURL_TOKEN = process.env.TINYURL_TOKEN || "y2SOyajOeWvjPgcWeISvzjHa3fKGkhfgnYNc9sxVLRtR7ZrHW28v7saCeNCw";

// Endpoint: /api/clicks?id=LINK_ID&days=30
router.get("/clicks", async (req, res) => {
  try {
    const { id, days } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Falta el parámetro id (link_id)" });
    }

    // Construyo URL para pedir estadísticas
    const url = `https://api.tinyurl.com/statistics/${id}?period=${days || "30d"}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${TINYURL_TOKEN}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();

    // Transformo la respuesta al formato { labels, values }
    const stats = data?.data?.statistics || [];

    const labels = stats.map(item => item.date);
    const values = stats.map(item => item.clicks);

    res.json({ labels, values });

  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;
