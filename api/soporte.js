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

// Objeto para almacenar configuraciones por ID
const configuracionesPorID = {}; // { id: { email, numeros, mensaje } }

// Objeto para manejar índices de rotación por ID
const indicesRotacion = {}; // { id: índice_actual }

export default function handler(req, res) {
  const { email, password, id } = req.query;

  // === 1. INICIO DE SESIÓN ===
  if (req.method === 'GET' && email && password) {
    const usuario = usuarios.find(
      (u) => u.email === email && u.password === password
    );

    if (!usuario) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    // Recupera la configuración asociada al email
    const configuracion = Object.values(configuracionesPorID).find(
      (config) => config.email === email
    );

    return res.status(200).json({
      success: true,
      limiteNumeros: usuario.limiteNumeros,
      configuracion,
    });
  }

  // === 2. ACCESO AL LINK GENERADO ===
  if (req.method === 'GET' && id) {
    if (!configuracionesPorID[id]) {
      return res.status(404).json({ error: "ID no encontrado" });
    }

    const configuracion = configuracionesPorID[id];

    // Manejar la rotación de números
    if (!indicesRotacion[id]) {
      indicesRotacion[id] = 0; // Inicializa el índice si no existe
    }

    const indiceActual = indicesRotacion[id];
    const numeroActual = configuracion.numeros[indiceActual];

    // Incrementa el índice para la próxima rotación
    indicesRotacion[id] = (indiceActual + 1) % configuracion.numeros.length;

    // Redirige al número actual de WhatsApp
    const whatsappLink = `https://wa.me/${numeroActual}?text=${encodeURIComponent(configuracion.mensaje)}`;
    return res.redirect(302, whatsappLink);
  }

  // === 3. GENERAR LINK CORTO (POST) ===
  if (req.method === 'POST') {
    const { email, numeros, mensaje } = req.body;

    // Verifica si el usuario existe
    const usuario = usuarios.find((u) => u.email === email);
    if (!usuario) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    // Verifica si ya existe un link generado para este usuario
    const configuracionExistente = Object.values(configuracionesPorID).find(
      (config) => config.email === email
    );
    if (configuracionExistente) {
      return res.status(400).json({ error: "Ya has generado un link. No puedes generar otro." });
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

  return res.status(400).json({ error: "Solicitud inválida" });
}

