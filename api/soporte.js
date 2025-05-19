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
  },
  {
  email: "prueba@multi.link",
  password: "test",
  limiteNumeros: 1
  },
  {
  email: "tomas@gmail.com",
  password: "tomas123",
  limiteNumeros: 3
  }

];

// Rotación por email
const indicesUsuarios = {};

// Objeto para almacenar configuraciones por usuario
const configuraciones = {}; // { email: { link, numeros, mensaje } }

export default function handler(req, res) {
  const { email, password, id } = req.query;

  // === 1. INICIO DE SESIÓN ===
  if (email && password && req.method === 'GET') {
    const usuario = usuarios.find(
      (u) => u.email === email && u.password === password
    );

    if (!usuario) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    // Recupera la configuración asociada al email
    const configuracion = configuraciones[email] || null;

    return res.status(200).json({
      success: true,
      limiteNumeros: usuario.limiteNumeros,
      configuracion,
    });
  }

  // === 2. GENERAR LINK CORTO (POST) ===
  if (req.method === 'POST') {
    const { email, numeros, mensaje } = req.body;

    // Verifica si el usuario existe
    const usuario = usuarios.find((u) => u.email === email);
    if (!usuario) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    // Verifica el límite de números
    if (numeros.length > usuario.limiteNumeros) {
      return res.status(400).json({ error: `Excediste el límite de números permitido (${usuario.limiteNumeros})` });
    }

    // Genera el link
    const id = Math.random().toString(36).substring(2, 8);
    const link = `${req.headers.origin || 'http://localhost:3000'}/soporte?id=${id}`;

    // Guarda la configuración asociada al email
    configuraciones[email] = { link, numeros, mensaje };

    return res.status(200).json({ link });
  }

  // === 3. REDIRECCIÓN POR ID (GET) ===
  if (req.method === 'GET' && id) {
    const config = configuraciones[id];

    if (!config) {
      return res.status(404).json({ error: "ID no encontrado" });
    }

    const { numeros, mensaje, email } = config;

    if (!indicesUsuarios[email]) {
      indicesUsuarios[email] = 0;
    }

    const indice = indicesUsuarios[email];
    const numeroActual = numeros[indice];

    indicesUsuarios[email] = (indice + 1) % numeros.length;

    const link = `https://wa.me/${numeroActual}?text=${encodeURIComponent(mensaje)}`;
    return res.redirect(302, link);
  }

  if (req.method === 'POST' && req.body.action === 'reiniciarGenerador') {
    // Aquí podrías enviar un comando al frontend para ejecutar reiniciarGenerador()
    return res.status(200).json({ message: 'Generador reiniciado desde el backend.' });
  }

  // Si no coincide ningún caso válido
  return res.status(400).json({ error: "Solicitud inválida o faltan parámetros" });
}

