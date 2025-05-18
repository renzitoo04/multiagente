const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public')); // Carpeta para archivos HTML, CSS y JS

// Ruta para iniciar sesión
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  // Leer el archivo JSON
  const usuariosPath = path.join(__dirname, 'usuarios.json');
  const usuarios = JSON.parse(fs.readFileSync(usuariosPath, 'utf-8'));

  // Buscar el usuario
  const usuario = usuarios.find(u => u.email === email && u.password === password);

  if (usuario) {
    res.json({ success: true, limiteNumeros: usuario.limiteNumeros });
  } else {
    res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
  }
});

// Ruta para crear un nuevo usuario
app.post('/crear-usuario', (req, res) => {
  const { email, password, limiteNumeros } = req.body;

  // Leer el archivo JSON
  const usuariosPath = path.join(__dirname, 'usuarios.json');
  const usuarios = JSON.parse(fs.readFileSync(usuariosPath, 'utf-8'));

  // Verificar si el usuario ya existe
  if (usuarios.some(u => u.email === email)) {
    return res.status(400).json({ success: false, message: 'El usuario ya existe' });
  }

  // Agregar el nuevo usuario
  usuarios.push({ email, password, limiteNumeros });
  fs.writeFileSync(usuariosPath, JSON.stringify(usuarios, null, 2));

  res.json({ success: true, message: 'Usuario creado exitosamente' });
});

// Iniciar el servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});