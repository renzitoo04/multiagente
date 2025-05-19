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

// Configuraciones guardadas por ID corto
const configuraciones = {}; // { id: { numeros: [], mensaje, email } }

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

    return res.status(200).json({ success: true, limiteNumeros: usuario.limiteNumeros });
  }

  // === 2. GENERAR LINK CORTO (POST) ===
  if (req.method === 'POST') {
    const { numeros, mensaje, email } = req.body;

    const usuario = usuarios.find((u) => u.email === email);
    if (!usuario) {
      return res.status(401).json({ error: "Usuario no autenticado" });
    }

    if (!numeros || !Array.isArray(numeros) || numeros.length === 0) {
      return res.status(400).json({ error: "Números inválidos" });
    }

    if (numeros.length > usuario.limiteNumeros) {
      return res.status(400).json({ error: `Excediste el límite de números permitido (${usuario.limiteNumeros})` });
    }

    if (!mensaje || typeof mensaje !== 'string') {
      return res.status(400).json({ error: "Mensaje inválido" });
    }

    const id = Math.random().toString(36).substring(2, 8); // genera ID corto
    configuraciones[id] = { numeros, mensaje, email };

    return res.status(200).json({ id });
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

