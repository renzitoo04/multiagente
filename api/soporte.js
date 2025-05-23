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
    return []; // Devuelve un array vacío si ocurre un error
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

    // Cargar la lista de usuarios desde usuarios.json
    const usuarios = cargarUsuarios();

    // Verificar si los usuarios se cargaron correctamente
    if (!usuarios || usuarios.length === 0) {
      return res.status(500).json({ error: 'No se pudo cargar la lista de usuarios.' });
    }

    // Buscar el usuario en la lista
    const usuario = usuarios.find(
      (u) => u.email === email && u.password === password
    );

    if (!usuario) {
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

  // === 2. ACCESO AL LINK GENERADO ===
  if (req.method === 'GET' && req.query.id) {
    const { id } = req.query;

    console.log('ID recibido:', id); // Log para verificar el ID recibido

    if (!configuracionesPorID[id]) {
      console.error('ID no encontrado en configuracionesPorID:', id);
      return res.status(404).json({ error: "ID no encontrado" });
    }

    const configuracion = configuracionesPorID[id];
    console.log('Configuración encontrada:', configuracion); // Log para verificar la configuración

    // Manejar la rotación de números
    if (!indicesRotacion[id]) {
      indicesRotacion[id] = 0; // Inicializa el índice si no existe
    }

    const indiceActual = indicesRotacion[id];
    const numeroActual = configuracion.numeros[indiceActual];

    if (!numeroActual) {
      console.error('Número actual no encontrado para el ID:', id);
      return res.status(500).json({ error: "Número no encontrado" });
    }

    // Incrementa el índice para la próxima rotación
    indicesRotacion[id] = (indiceActual + 1) % configuracion.numeros.length;

    // Redirige al número actual de WhatsApp
    const whatsappLink = `https://wa.me/${numeroActual}?text=${encodeURIComponent(configuracion.mensaje || '')}`;
    console.log('Redirigiendo a:', whatsappLink); // Log para verificar el link de redirección
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
    // Acorta el link usando TinyURL
    const linkAcortado = await acortarLink(linkOriginal);

    // Guarda la nueva configuración, incluyendo el link corto
    configuracionesPorID[id] = { email, numeros, mensaje, link: linkAcortado };

    // Devuelve el link acortado y el ID
    return res.status(200).json({ id, link: linkAcortado });
  } catch (error) {
    console.error('Error generando el link:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}

  // === 4. ACTUALIZAR NÚMEROS DEL LINK EXISTENTE (PATCH) ===
  if (req.method === 'PATCH') {
  const { email, numeros, mensaje } = req.body;

  if (!email || !numeros || numeros.length === 0) {
    return res.status(400).json({ error: 'Datos inválidos' });
  }

  // Verificar si el usuario ya tiene un link generado
  const configuracionExistente = Object.values(configuracionesPorID).find(
    (config) => config.email === email
  );

  if (!configuracionExistente) {
    return res.status(404).json({ error: 'No se encontró un link asociado a este perfil.' });
  }

  // Actualizar los datos del link
  configuracionExistente.numeros = numeros;
  configuracionExistente.mensaje = mensaje;

  return res.status(200).json({ success: true, message: 'Link actualizado correctamente.' });
}

  // === 5. ACORTAR LINK MANUAL (POST) ===
  if (req.method === 'POST' && req.url === '/soporte/acortar') {
    const { linkOriginal } = req.body;

    if (!linkOriginal) {
      return res.status(400).json({ error: 'Debe proporcionar un link válido.' });
    }

    try {
      const linkAcortado = await acortarLink(linkOriginal);
      return res.status(200).json({ link: linkAcortado });
    } catch (error) {
      console.error('Error acortando el link:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  return res.status(400).json({ error: "Solicitud inválida" });
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


