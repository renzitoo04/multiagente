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

// Objeto para almacenar configuraciones por ID
const configuracionesPorID = {}; // { id: { email, numeros, mensaje } }

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

    // Genera el ID y el link
    const id = Math.random().toString(36).substring(2, 8);
    const link = `${req.headers.origin || 'http://localhost:3000'}/soporte?id=${id}`;

    // Guarda la configuración asociada al ID
    configuracionesPorID[id] = { email, numeros, mensaje };

    return res.status(200).json({ link });
  }

  if (req.method === 'GET') {
    const { id } = req.query;

    // Verifica si el ID existe
    if (!configuracionesPorID[id]) {
      return res.status(404).json({ error: "ID no encontrado" });
    }

    // Recupera la configuración asociada al ID
    const configuracion = configuracionesPorID[id];
    return res.status(200).json(configuracion);
  }

  return res.status(400).json({ error: "Solicitud inválida" });
}

