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

const indicesUsuarios = {};

export default function handler(req, res) {
  const { email, password, numeros, mensaje } = req.query;

  // INICIO DE SESIÓN
  if (email && password) {
    const usuario = usuarios.find(
      (u) => u.email === email && u.password === password
    );

    if (!usuario) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    return res.status(200).json({ success: true, limiteNumeros: usuario.limiteNumeros });
  }

  // REDIRECCIÓN AL NÚMERO DE WHATSAPP
  if (numeros && mensaje && email) {
    const listaNumeros = numeros.split(",");

    const usuario = usuarios.find((u) => u.email === email);
    if (!usuario) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (listaNumeros.length > usuario.limiteNumeros) {
      return res
        .status(400)
        .json({ error: `Excediste el límite de números permitido (${usuario.limiteNumeros})` });
    }

    if (!indicesUsuarios[email]) {
      indicesUsuarios[email] = 0;
    }

    const indice = indicesUsuarios[email];
    const numeroActual = listaNumeros[indice];

    indicesUsuarios[email] = (indice + 1) % listaNumeros.length;

    const link = `https://wa.me/${numeroActual}?text=${encodeURIComponent(mensaje)}`;

    return res.redirect(302, link); // Redirección automática
  }

  return res.status(400).json({ error: "Faltan parámetros obligatorios" });
}
