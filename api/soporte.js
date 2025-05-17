export default function handler(req, res) {
  const { numeros, mensaje } = req.query;

  if (!numeros || !mensaje) {
    res.status(400).json({ error: 'Faltan parámetros: números o mensaje' });
    return;
  }

  const listaNumeros = numeros.split(',');
  const numero = listaNumeros[Math.floor(Math.random() * listaNumeros.length)];
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

  res.writeHead(302, { Location: url });
  res.end();
}
