import fs from 'fs';
import path from 'path';

// Ruta al archivo JSON de usuarios
const usuariosPath = path.join(process.cwd(), 'api', 'usuarios.json');

// Función para leer usuarios desde el archivo JSON
function leerUsuarios() {
  const data = fs.readFileSync(usuariosPath, 'utf-8');
  return JSON.parse(data);
}

// Función para guardar usuarios en el archivo JSON
function guardarUsuarios(usuarios) {
  fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2), 'utf-8');
}

// Objeto para almacenar configuraciones por ID
const configuracionesPorID = {}; // { id: { email, numeros, mensaje } }

// Objeto para manejar índices de rotación por ID
const indicesRotacion = {}; // { id: índice_actual }

export default function handler(req, res) {
  const { email, password, id } = req.query;

  // === 1. AGREGAR NUEVO USUARIO ===
  if (req.method === 'POST' && req.query.action === 'agregarUsuario') {
    const usuarios = leerUsuarios();

    // Verifica si el usuario ya existe
    const usuarioExistente = usuarios.find((u) => u.email === email);
    if (usuarioExistente) {
      return res.status(400).json({ error: "El usuario ya existe." });
    }

    // Agrega el nuevo usuario
    const nuevoUsuario = { email, password, limiteNumeros };
    usuarios.push(nuevoUsuario);

    // Guarda los usuarios actualizados en el archivo JSON
    guardarUsuarios(usuarios);

    return res.status(200).json({ success: true, message: "Usuario agregado correctamente." });
  }

  // === 2. INICIO DE SESIÓN ===
  if (req.method === 'GET' && req.query.action === 'login') {
    const usuarios = leerUsuarios();
    const usuario = usuarios.find(
      (u) => u.email === req.query.email && u.password === req.query.password
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

  // === 3. ACCESO AL LINK GENERADO ===
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

  // === 4. GENERAR LINK CORTO (POST) ===
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

