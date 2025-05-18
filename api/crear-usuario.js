import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const filePath = path.join(process.cwd(), 'usuarios.json');

  if (req.method === 'POST') {
    const { email, password, limiteNumeros } = req.body;

    // Leer el archivo JSON
    let usuarios = [];
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      usuarios = JSON.parse(data);
    }

    // Verificar si el usuario ya existe
    if (usuarios.some(u => u.email === email)) {
      return res.status(400).json({ success: false, message: 'El usuario ya existe' });
    }

    // Agregar el nuevo usuario
    usuarios.push({ email, password, limiteNumeros });
    fs.writeFileSync(filePath, JSON.stringify(usuarios, null, 2));

    return res.status(200).json({ success: true, message: 'Usuario creado exitosamente' });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}