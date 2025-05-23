const fs = require('fs');
const path = require('path');

// Ruta al archivo usuarios.json
const usuariosPath = path.join(__dirname, 'usuarios.json');

// Función para cargar usuarios dinámicamente
function cargarUsuarios() {
  try {
    const data = fs.readFileSync(usuariosPath, 'utf8');
    const usuarios = JSON.parse(data);
    console.log('Usuarios cargados correctamente:', usuarios); // Log para verificar los usuarios cargados
    return usuarios;
  } catch (error) {
    console.error('Error al cargar la lista de usuarios:', error);
    return [];
  }
}

// Objeto para almacenar configuraciones por ID
const configuracionesPorID = {}; // { id: { email, numeros, mensaje } }

// Objeto para manejar índices de rotación por ID
const indicesRotacion = {}; // { id: índice_actual }

async function acortarLink(linkOriginal) {
  const tinyUrlToken = 'apvW0ktGoIEIlrA5PBzjTFb2v4IS4e3gYkptQei0qYYzSXNukYvK2GwLXKVP'; // Token de TinyURL
  try {
    const response = await fetch(`https://api.tinyurl.com/create`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tinyUrlToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: linkOriginal,
        domain: 'tiny.one', // Puedes usar 'tiny.one' o 'tinyurl.com'
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error acortando el link con TinyURL:', errorText);
      return linkOriginal; // Devuelve el link original si falla
    }

    const data = await response.json();
    return data.data.tiny_url; // Devuelve el link acortado
  } catch (error) {
    console.error('Error en la función acortarLink con TinyURL:', error);
    return linkOriginal; // Devuelve el link original si ocurre un error
  }
}

// Exporta la función principal del handler
export default async function handler(req, res) {
  if (req.method === 'GET' && req.query.email && req.query.password) {
    const { email, password } = req.query;
    console.log('Datos recibidos desde el frontend:', { email, password }); // Log para verificar los datos recibidos

    // Cargar la lista de usuarios desde usuarios.json
    const usuarios = cargarUsuarios();

    // Buscar el usuario en la lista
    const usuario = usuarios.find(
      (u) => u.email === email && u.password === password
    );

    if (!usuario) {
      console.error('Usuario no encontrado o credenciales incorrectas');
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Recuperar la configuración asociada al email
    const configuracion = Object.values(configuracionesPorID).find(
      (config) => config.email === email
    ) || null;

    return res.status(200).json({
      success: true,
      limiteNumeros: usuario.limiteNumeros,
      configuracion
    });
  }

  return res.status(400).json({ error: 'Solicitud inválida' });
}

async function acortarLinkManual() {
  const linkOriginal = document.getElementById('link-original').value.trim();

  if (!linkOriginal) {
    alert('Por favor, ingresa un link válido.');
    return;
  }

  try {
    const response = await fetch('/soporte/acortar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ linkOriginal }),
    });

    const data = await response.json();

    if (response.ok) {
      // Muestra el link acortado en el DOM
      document.getElementById('acortar-link-output').innerHTML = `
        <p>Tu link acortado:</p>
        <a href="${data.link}" target="_blank">${data.link}</a>
      `;
    } else {
      alert('Error: ' + data.error);
    }
  } catch (error) {
    console.error('Error acortando el link:', error);
    alert('Error al acortar el link. Inténtalo de nuevo.');
  }
}

// Mostrar el apartado "Acortar Link" después de iniciar sesión
function mostrarAcortarLink() {
  document.getElementById('acortar-link-container').style.display = 'block';
}

// Llama a esta función después de iniciar sesión
async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!email || !password) {
    document.getElementById('login-error').textContent = 'Por favor, ingresa tu correo y contraseña.';
    return;
  }

  try {
    const response = await fetch(`/soporte?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`);
    const data = await response.json();

    if (response.ok) {
      // Oculta el contenedor de inicio de sesión
      document.getElementById('login-container').style.display = 'none';

      // Muestra el generador principal
      document.getElementById('generador-container').style.display = 'block';

      // Muestra el apartado "Acortar Link"
      mostrarAcortarLink();

      // Configura el límite de números
      limiteNumeros = data.limiteNumeros;

      // Si hay una configuración existente, mostrarla
      if (data.configuracion) {
        const { link, numeros, mensaje } = data.configuracion;

        document.getElementById('detalles-link').style.display = 'block';
        document.getElementById('numeros-generados').textContent = numeros.join(', ');
        document.getElementById('mensaje-generado').textContent = mensaje || 'Sin mensaje';

        // Mostrar el apartado "Editar Link"
        document.getElementById('editar-link-container').style.display = 'block';

        // Mostrar los números en el apartado "Editar Link"
        mostrarEditarLink(numeros);

        // Guardar los datos en localStorage
        localStorage.setItem('linkGenerado', link);
        localStorage.setItem('numerosGenerados', JSON.stringify(numeros));
        localStorage.setItem('mensajeGenerado', mensaje);
      }
    } else {
      document.getElementById('login-error').textContent = data.error;
    }
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    document.getElementById('login-error').textContent = 'Error al iniciar sesión.';
  }
}


