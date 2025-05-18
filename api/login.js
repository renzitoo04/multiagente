import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), 'usuarios.json');

  if (req.method === 'POST') {
    const { email, password } = req.body;

    // Leer el archivo JSON
    const usuarios = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // Buscar el usuario
    const usuario = usuarios.find(u => u.email === email && u.password === password);

    if (usuario) {
      res.status(200).json({ success: true, limiteNumeros: usuario.limiteNumeros });
    } else {
      res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}