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

  // === 2. EDITAR NÚMERO (PUT) ===
  if (req.method === 'PUT') {
    const { email, index, nuevoNumero } = req.body;

    // Encuentra la configuración asociada al email
    const configuracion = Object.values(configuracionesPorID).find(
      (config) => config.email === email
    );

    if (!configuracion) {
      return res.status(404).json({ error: "Configuración no encontrada" });
    }

    // Actualiza el número en la posición especificada
    configuracion.numeros[index] = nuevoNumero;

    return res.status(200).json({ success: true, message: "Número actualizado correctamente." });
  }

  return res.status(400).json({ error: "Solicitud inválida" });
}

