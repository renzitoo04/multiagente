export default function handler(req, res) {
  const numeros = [
    '5492944585356',
    '5491165388118'
  ];

  // Mantener un número aleatorio (porque Vercel no guarda estado)
  const numero = numeros[Math.floor(Math.random() * numeros.length)];
  const mensaje = 'Hola, necesito ayuda';
  const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;

  // Redirigir al número de WhatsApp
  res.writeHead(302, { Location: url });
  res.end();
}
