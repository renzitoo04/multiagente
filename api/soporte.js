// Lista de usuarios (puedes agregar más usuarios aquí)
const usuarios = [
  {
    email: "renzobianco@gmail.com",
    password: "renzoxdlol",
    limiteNumeros: 5
  },
  {
    email: "nuevo_usuario@gmail.com",
    password: "contraseña123",
    limiteNumeros: 10
  }
];

// Variable global para mantener el índice actual
let indiceActual = 0;

export default function handler(req, res) {
  const { email, password, numeros, mensaje } = req.query;

  // Validar credenciales del usuario
  if (email && password) {
    const usuario = usuarios.find(
      (u) => u.email === email && u.password === password
    );

    if (!usuario) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    // Responder con el límite de números permitido
    return res.status(200).json({ success: true, limiteNumeros: usuario.limiteNumeros });
  }

  // Validar parámetros para generación de links
  if (numeros && mensaje) {
    const listaNumeros = numeros.split(",");

    // Validar el límite de números permitido
    const usuario = usuarios.find((u) => u.email === email);
    if (!usuario) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (listaNumeros.length > usuario.limiteNumeros) {
      return res
        .status(400)
        .json({ error: `Excediste el límite de números permitido (${usuario.limiteNumeros})` });
    }

    // Generar el mensaje para el número actual
    const numeroActual = listaNumeros[indiceActual];
    const link = `https://wa.me/${numeroActual}?text=${encodeURIComponent(
      mensaje
    )}`;

    // Incrementar el índice para el siguiente número
    indiceActual = (indiceActual + 1) % listaNumeros.length;

    return res.status(200).json({ link });
  }

  // Si faltan parámetros obligatorios
  return res.status(400).json({ error: "Faltan parámetros obligatorios" });
}
