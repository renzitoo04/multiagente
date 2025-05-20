import fs from 'fs';
import path from 'path';

// Ruta al archivo JSON de usuarios
const usuariosPath = path.join(process.cwd(), 'api', 'usuarios.json');

// Función para leer usuarios desde el archivo JSON
function leerUsuarios() {
  const data = fs.readFileSync(usuariosPath, 'utf-8');
  return JSON.parse(data);
}

export default function handler(req, res) {
  const { email, password } = req.query;

  // === INICIO DE SESIÓN ===
  if (req.method === 'GET' && req.query.action === 'login') {
    const usuarios = leerUsuarios();

    // Busca el usuario por email y contraseña
    const usuario = usuarios.find(
      (u) => u.email === email && u.password === password
    );

    if (!usuario) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    return res.status(200).json({
      success: true,
      limiteNumeros: usuario.limiteNumeros
    });
  }

  return res.status(400).json({ error: "Solicitud inválida" });
}

