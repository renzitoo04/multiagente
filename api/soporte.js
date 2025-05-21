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
  if (req.method === 'POST') {
    const { email, numeros, mensaje } = req.body;

    if (!email || !numeros || numeros.length === 0) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    // Genera un nuevo ID y link si no existe
    const id = Math.random().toString(36).substring(2, 8);
    const link = `${req.headers.origin || 'http://localhost:3000'}/soporte?id=${id}`;

    // Guarda la nueva configuración
    configuracionesPorID[id] = { email, numeros, mensaje };

    return res.status(200).json({ link });
  }

  if (req.method === 'PATCH') {
    const { link, numeros } = req.body;

    // Busca el link en las configuraciones
    const id = Object.keys(configuracionesPorID).find(
      (key) => `${req.headers.origin || 'http://localhost:3000'}/soporte?id=${key}` === link
    );

    if (!id) {
      return res.status(404).json({ error: 'Link no encontrado' });
    }

    // Actualiza los números asociados al link
    configuracionesPorID[id].numeros = numeros;

    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: 'Método no permitido' });
}

