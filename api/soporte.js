import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Objeto para almacenar configuraciones por ID
const configuracionesPorID = {}; // { id: { email, numeros, mensaje } }

// Objeto para manejar índices de rotación por ID
const indicesRotacion = {}; // { id: índice_actual }

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
  // === 1. INICIO DE SESIÓN ===
  if (req.method === 'POST' && req.url === '/api/login') {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Faltan datos de inicio de sesión' });
    }

    try {
      // Verificar usuario en Supabase
      const { data: user, error } = await supabase
        .from('users')
        .select('email, password, limiteNumeros')
        .eq('email', email)
        .single();

      if (error || !user || user.password !== password) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
      }

      // Recuperar configuración del link
      const { data: linkData, error: linkError } = await supabase
        .from('link')
        .select('id, link, numeros, mensaje')
        .eq('email', email)
        .single();

      if (linkError && linkError.code !== 'PGRST116') {
        return res.status(500).json({ error: 'Error al recuperar el link' });
      }

      return res.status(200).json({
        success: true,
        limiteNumeros: user.limiteNumeros,
        configuracion: linkData || null,
      });
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // === 2. GENERAR LINK ===
  if (req.method === 'POST' && req.url === '/api/generar-link') {
    const { email, numeros, mensaje } = req.body;

    if (!email || !numeros || numeros.length === 0) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    try {
      // Verificar si ya existe un link para el usuario
      const { data: existingLink, error: existingError } = await supabase
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
      const { error: insertError } = await supabase
        .from('link')
        .insert([{ email, numeros, mensaje, link: linkAcortado }]);

      if (insertError) {
        throw insertError;
      }

      return res.status(200).json({ id, link: linkAcortado });
    } catch (err) {
      console.error('Error generando el link:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  }

  // === 3. ACTUALIZAR LINK ===
  if (req.method === 'PATCH' && req.url === '/api/actualizar-link') {
    const { email, link, numeros, mensaje } = req.body;

    if (!email || !link || !numeros || numeros.length === 0) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    try {
      // Actualizar el link en Supabase
      const { error } = await supabase
        .from('link')
        .update({ numeros, mensaje })
        .eq('email', email);

      if (error) {
        throw error;
      }

      return res.status(200).json({ success: true, link });
    } catch (err) {
      console.error('Error actualizando el link:', err);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
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
