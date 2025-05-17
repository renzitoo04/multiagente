// Variable global para mantener el índice actual
let indiceActual = 0;

export default function handler(req, res) {
  const { numeros, mensaje } = req.query;

  if (!numeros || !mensaje) {
    res.status(400).json({ error: 'Faltan parámetros: números o mensaje' });
    return;
  }

  // Convertir la lista de números en un array
  const listaNumeros = numeros.split(',');

  // Seleccionar el número actual basado en el índice
  const numero = listaNumeros[indiceActual];

  // Incrementar el índice para la próxima solicitud
  indiceActual = (indiceActual + 1) % listaNumeros.length;

  // Construir la URL de WhatsApp
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

  // Redirigir al usuario a la URL de WhatsApp
  res.writeHead(302, { Location: url });
  res.end();
}
