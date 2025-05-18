const usuarios = [
  {
    email: "renzobianco@gmail.com",
    password: "renzoxdlol",
    limiteNumeros: 2
  },
  {
    email: "nuevo_usuario@gmail.com",
    password: "contraseña123",
    limiteNumeros: 10
  },
  {
    email: "donarumamatias@gmail.com",
    password: "contraseña12",
    limiteNumeros: 3
  }
];

// Variable global para mantener el índice actual de cada usuario
const indicesUsuarios = {};

export default function handler(req, res) {
  const { email, password, numeros, mensaje } = req.query;

  // Validar credenciales del usuario (inicio de sesión)
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
  if (numeros && mensaje && email) {
    const listaNumeros = numeros.split(",");

    // Validar que el usuario exista
    const usuario = usuarios.find((u) => u.email === email);
    if (!usuario) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    // Validar el límite de números permitido
    if (listaNumeros.length > usuario.limiteNumeros) {
      return res
        .status(400)
        .json({ error: `Excediste el límite de números permitido (${usuario.limiteNumeros})` });
    }

    // Inicializar el índice del usuario si no existe
    if (!indicesUsuarios[email]) {
      indicesUsuarios[email] = 0;
    }

    // Obtener el número actual basado en el índice del usuario
    const numeroActual = listaNumeros[indicesUsuarios[email]];
    const link = `https://wa.me/${numeroActual}?text=${encodeURIComponent(
      mensaje
    )}`;

    // Incrementar el índice para el siguiente número
    indicesUsuarios[email] = (indicesUsuarios[email] + 1) % listaNumeros.length;

    return res.status(200).json({ link });
  }

  // Si faltan parámetros obligatorios
  return res.status(400).json({ error: "Faltan parámetros obligatorios" });
}
