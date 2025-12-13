// ============================================
// LOGIN MOCK - SIN BASE DE DATOS
// ============================================
// Este endpoint permite loguearte SIN Supabase
// Útil para testing rápido

// USUARIOS MOCK (en memoria)
const USUARIOS_MOCK = [
  {
    email: 'test@linkify.com',
    password: 'password123',
    limiteNumeros: 10,
    telefono: '+5491165388118'
  },
  {
    email: 'admin@linkify.com',
    password: 'admin123',
    limiteNumeros: 20,
    telefono: '+5491123456789'
  },
  {
    email: 'demo@linkify.com',
    password: 'demo123',
    limiteNumeros: 5,
    telefono: '+5491187654321'
  }
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Faltan datos de inicio de sesión' });
  }

  try {
    // Buscar usuario en el array mock
    const usuario = USUARIOS_MOCK.find(
      u => u.email.toLowerCase() === email.toLowerCase().trim()
    );

    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    if (usuario.password !== password.trim()) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Login exitoso
    return res.status(200).json({
      email: usuario.email,
      limiteNumeros: usuario.limiteNumeros,
      mock: true // Indicador de que es un usuario mock
    });

  } catch (err) {
    console.error('Error en login mock:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

// ============================================
// CREDENCIALES DISPONIBLES:
// ============================================
// 1. test@linkify.com / password123
// 2. admin@linkify.com / admin123
// 3. demo@linkify.com / demo123
// ============================================
