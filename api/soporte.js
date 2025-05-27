import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function acortarLink(linkOriginal) {
  const tinyUrlToken = process.env.TINYURL_TOKEN; // Asegúrate de agregar este token a tu archivo .env
  try {
    const response = await fetch('https://api.tinyurl.com/create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tinyUrlToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: linkOriginal, domain: 'tiny.one' }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error acortando el link con TinyURL:', errorText);
      return linkOriginal;
    }

    const data = await response.json();
    return data.data.tiny_url;
  } catch (error) {
    console.error('Error en la función acortarLink:', error);
    return linkOriginal;
  }
}

// Exporta la función principal del handler
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

    try {
      // Verificar si ya existe un link para el usuario
      const { data: existingLink } = await supabase
        .from('link')
        .select('id')
        .eq('email', email)
        .single();

      if (existingLink) {
        return res.status(403).json({ error: 'Ya tienes un link generado. Solo puedes actualizarlo.' });
      }

      // Generar el link
      const id = Math.random().toString(36).substring(2, 8);
      const linkOriginal = `${req.headers.origin || 'http://localhost:3000'}/soporte?id=${id}`;
      const linkAcortado = await acortarLink(linkOriginal);

      // Guardar el link en Supabase
      const { error } = await supabase
        .from('link')
        .insert([{ id, email, numeros, mensaje, link: linkAcortado }]);

      if (error) {
        throw error;
      }

      return res.status(200).json({ id, link: linkAcortado });
    } catch (err) {
      console.error('Error generando el link:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // === 4. ACTUALIZAR NÚMEROS DEL LINK EXISTENTE (PATCH) ===
  if (req.method === 'PATCH') {
    const { email, link, numeros, mensaje } = req.body;

    // Extrae el ID del link
    const id = link.split('id=')[1]; // Obtiene el ID después de "id="

    if (!id || !configuracionesPorID[id]) {
      return res.status(404).json({ error: 'Link no encontrado' });
    }

    // Verifica que el email coincida con el propietario del link
    if (configuracionesPorID[id].email !== email) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar este link.' });
    }

    if (!numeros || numeros.length === 0) {
      return res.status(400).json({ error: 'Debe proporcionar al menos un número válido.' });
    }

    // Actualiza los números asociados al link
    configuracionesPorID[id].numeros = numeros;

    // Actualiza el mensaje si está definido
    if (mensaje !== undefined) {
      configuracionesPorID[id].mensaje = mensaje;
    }

    try {
      // Devuelve el link corto guardado
      const linkCorto = configuracionesPorID[id].link;
      return res.status(200).json({ success: true, link: linkCorto });
    } catch (error) {
      console.error('Error actualizando el link:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
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
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem('usuarioEmail', email);
      document.getElementById('login-container').style.display = 'none';
      document.getElementById('generador-container').style.display = 'block';

      // Si ya existe un link, mostrar los detalles
      if (data.link) {
        const { link, numeros, mensaje } = data.link;

        document.getElementById('link-generado').href = link;
        document.getElementById('link-generado').textContent = link;
        document.getElementById('numeros-rotativos').textContent = numeros.join(', ');
        document.getElementById('mensaje-automatico').textContent = mensaje || 'Sin mensaje';

        document.getElementById('detalles-link-container').style.display = 'block';
      }
    } else {
      document.getElementById('login-error').textContent = data.error;
    }
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    document.getElementById('login-error').textContent = 'Error al iniciar sesión.';
  }
}


