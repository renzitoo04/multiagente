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

export default async function handler(req, res) {
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

    if (!email || !numeros || numeros.length === 0) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    // Genera un nuevo ID y link original
    const id = Math.random().toString(36).substring(2, 8);
    const linkOriginal = `${req.headers.origin || 'http://localhost:3000'}/soporte?id=${id}`;

    try {
      // Acorta el link usando Bitly
      const link = await acortarLink(linkOriginal);

      // Guarda la nueva configuración
      configuracionesPorID[id] = { email, numeros, mensaje };

      return res.status(200).json({ link, id }); // Devuelve el link y el ID
    } catch (error) {
      console.error('Error generando el link:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // === 4. ACTUALIZAR NÚMEROS DEL LINK EXISTENTE (PATCH) ===
  if (req.method === 'PATCH') {
    const { link, numeros } = req.body;

    // Extrae el ID del link
    const id = link.split('id=')[1]; // Obtiene el ID después de "id="

    if (!id || !configuracionesPorID[id]) {
      return res.status(404).json({ error: 'Link no encontrado' });
    }

    if (!numeros || numeros.length === 0) {
      return res.status(400).json({ error: 'Debe proporcionar al menos un número válido.' });
    }

    // Actualiza los números asociados al link
    configuracionesPorID[id].numeros = numeros;

    return res.status(200).json({ success: true, link });
  }

  return res.status(400).json({ error: "Solicitud inválida" });
}

async function acortarLink(linkOriginal) {
  const bitlyToken = 'f0eba299d0f6afb470ecaae24209b03b8548e8a4'; // Token de Bitly
  try {
    const response = await fetch('https://api-ssl.bitly.com/v4/shorten', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${bitlyToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ long_url: linkOriginal }),
    });

    if (!response.ok) {
      console.error('Error acortando el link:', await response.text());
      return linkOriginal; // Devuelve el link original si falla
    }

    const data = await response.json();
    return data.link; // Devuelve el link acortado
  } catch (error) {
    console.error('Error en la función acortarLink:', error);
    return linkOriginal; // Devuelve el link original si ocurre un error
  }
}

async function generarLink() {
  const numeros = Array.from(document.querySelectorAll('.numero'))
    .map(input => input.value.trim())
    .filter(num => num !== '' && num !== '+549'); // Filtra el valor por defecto

  const mensaje = document.getElementById('mensaje').value.trim(); // Permitir mensaje vacío
  const email = document.getElementById('email').value;

  if (numeros.length === 0) {
    alert('Por favor, ingresa al menos un número válido.');
    return;
  }

  try {
    const response = await fetch('/soporte', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, numeros, mensaje })
    });

    const data = await response.json();

    if (response.ok) {
      const link = data.link;

      // Guarda el link generado en localStorage
      localStorage.setItem('linkGenerado', link);
      localStorage.setItem('numerosGenerados', JSON.stringify(numeros));
      localStorage.setItem('mensajeGenerado', mensaje);

      // Muestra el link generado en el DOM
      document.getElementById('output').innerHTML = `
        <p>Tu link generado:</p>
        <a href="${link}" target="_blank">${link}</a>
      `;

      // Muestra los detalles del link
      document.getElementById('detalles-link').style.display = 'block';
      document.getElementById('numeros-generados').textContent = numeros.join(', ');
      document.getElementById('mensaje-generado').textContent = mensaje || 'Sin mensaje';

      // Muestra el apartado "Editar Link"
      document.getElementById('editar-link-container').style.display = 'block';

      // Muestra los números en el apartado "Editar Link"
      mostrarEditarLink(numeros);
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Error generando link:', error);
  }
}

