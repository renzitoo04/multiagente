import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

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
      const link = `${req.headers.origin || 'http://localhost:3000'}/soporte?id=${id}`;

      // Guardar el link en Supabase
      const { error } = await supabase
        .from('link')
        .insert([{ email, numeros, mensaje, link }]);

      if (error) {
        throw error;
      }

      return res.status(200).json({ link });
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

  if (req.method === 'GET' && req.url.startsWith('/api/obtener-link')) {
    const email = req.query.email;

    if (!email) {
      return res.status(400).json({ error: 'Email no proporcionado' });
    }

    try {
      const { data, error } = await supabase
        .from('link')
        .select('id, link, numeros, mensaje')
        .eq('email', email)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'No se encontró un link para este perfil' });
      }

      return res.status(200).json(data);
    } catch (err) {
      console.error('Error al obtener el link:', err);
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
