import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
const indicesRotacion = {}; // Control de índices de rotación por ID

async function acortarLink(linkOriginal) {
  try {
    const response = await fetch('https://api.tinyurl.com/create', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.TINYURL_TOKEN}`, // Token de TinyURL
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: linkOriginal, domain: 'tiny.one' }),
    });

    if (!response.ok) {
      console.error('Error al acortar el link:', await response.text());
      return linkOriginal; // Devuelve el link original si falla
    }

    const data = await response.json();
    return data.data.tiny_url; // Devuelve el link acortado
  } catch (error) {
    console.error('Error en la función acortarLink:', error);
    return linkOriginal; // Devuelve el link original si ocurre un error
  }
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { email, numeros, mensaje } = req.body;

    if (!email || !numeros || numeros.length === 0) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    // Filtrar números válidos
    const numerosValidos = numeros.filter(num => num !== '' && num !== '+549');

    if (numerosValidos.length === 0) {
      return res.status(400).json({ error: 'No se encontraron números válidos.' });
    }

    try {
      // Verificar si el usuario ya tiene un link
      const { data: linkExistente, error: errorExistente } = await supabase
        .from('link')
        .select('id')
        .eq('email', email)
        .single();

      if (linkExistente) {
        return res.status(400).json({ error: 'Ya tienes un link generado. No puedes crear más de uno.' });
      }

      const id = Math.random().toString(36).substring(2, 8);
      const linkOriginal = `${req.headers.origin || 'http://localhost:3000'}/api/soporte?id=${id}`;
      const linkAcortado = await acortarLink(linkOriginal);

      const { error } = await supabase
        .from('link')
        .insert([{ id, email, numeros: numerosValidos, mensaje, link: linkAcortado }]);

      if (error) {
        console.error('Error al guardar en Supabase:', error);
        return res.status(500).json({ error: 'Error al guardar la configuración.' });
      }

      return res.status(200).json({ id, link: linkAcortado });
    } catch (error) {
      console.error('Error generando el link:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  }

  if (req.method === 'GET') {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Falta el email en la consulta.' });
    }

    try {
      const { data: link, error } = await supabase
        .from('link')
        .select('id, numeros, mensaje, link')
        .eq('email', email)
        .single();

      if (error || !link) {
        return res.status(404).json({ error: 'No se encontró un link asociado a este usuario.' });
      }

      return res.status(200).json(link);
    } catch (error) {
      console.error('Error al recuperar el link:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  }

  if (req.method === 'PATCH') {
    const { email, numeros, mensaje, id } = req.body;

    if (!email || !numeros || numeros.length === 0 || !id) {
      return res.status(400).json({ error: 'Datos inválidos para actualizar el link.' });
    }

    // Filtrar números válidos en el backend
    const numerosValidos = numeros.filter(num => num !== '' && num !== '+549');

    if (numerosValidos.length === 0) {
      return res.status(400).json({ error: 'No se encontraron números válidos.' });
    }

    try {
      const linkOriginal = `${req.headers.origin || 'http://localhost:3000'}/api/soporte?id=${id}`;
      const linkAcortado = await acortarLink(linkOriginal);

      const { error } = await supabase
        .from('link')
        .update({ numeros: numerosValidos, mensaje, link: linkAcortado })
        .eq('id', id)
        .eq('email', email);

      if (error) {
        console.error('Error al actualizar en Supabase:', error);
        return res.status(500).json({ error: 'Error al actualizar el link.' });
      }

      return res.status(200).json({ link: linkAcortado });
    } catch (error) {
      console.error('Error actualizando el link:', error);
      return res.status(500).json({ error: 'Error interno del servidor.' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido.' });
}

async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value.trim();
  const loginError = document.getElementById('login-error');

  loginError.style.display = 'none';
  loginError.textContent = '';

  if (!email || !password) {
    loginError.textContent = 'Por favor, ingresa tu correo y contraseña.';
    loginError.style.display = 'block';
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
      // Guardar datos del usuario
      localStorage.setItem('usuarioEmail', email);

      // Mostrar el generador y ocultar el login
      document.getElementById('login-container').style.display = 'none';
      document.getElementById('generador-container').style.display = 'block';

      // Configurar información del usuario
      document.getElementById('user-avatar').textContent = email.charAt(0).toUpperCase();
      document.getElementById('user-email-display').textContent = email;

      // Recuperar datos del link asociado al usuario
      const linkResponse = await fetch(`/api/soporte?email=${email}`);
      const linkData = await linkResponse.json();

      if (linkResponse.ok) {
        mostrarDetallesLink(linkData);
      } else {
        console.log('No se encontró un link asociado a este usuario.');
      }

      showNotification('Inicio de sesión exitoso.');
    } else {
      loginError.textContent = data.error;
      loginError.style.display = 'block';
    }
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    loginError.textContent = 'Error al iniciar sesión. Por favor, inténtalo de nuevo.';
    loginError.style.display = 'block';
  }
}

function mostrarDetallesLink(linkData) {
  const { link, numeros, mensaje } = linkData;

  // Mostrar detalles del link
  document.getElementById('detalles-link').style.display = 'block';
  document.getElementById('output').innerHTML = `
    <p>Tu link generado:</p>
    <a href="${link}" target="_blank">${link}</a>
  `;
  document.getElementById('output').style.display = 'block';
  document.getElementById('numeros-generados').textContent = numeros.join(', ');
  document.getElementById('mensaje-generado').textContent = mensaje || 'Sin mensaje';

  // Habilitar la sección de "Actualizar Link"
  document.getElementById('editar-link-container').style.display = 'block';

  // Cargar datos en el formulario de edición
  mostrarEditarLink(numeros, mensaje);
}

function mostrarEditarLink(numeros, mensaje) {
  const editarNumerosContainer = document.getElementById('editar-numeros-container');
  editarNumerosContainer.innerHTML = '';

  numeros.forEach((numero, index) => {
    const numeroItem = document.createElement('div');
    numeroItem.classList.add('numero-container');
    numeroItem.innerHTML = `
      <span class="bandera-container">
        <img src="https://flagcdn.com/w40/ar.png" alt="Argentina" class="bandera">
      </span>
      <input type="text" id="editar-numero-${index}" class="numero" value="${numero}" placeholder="Ejemplo: +5492944585356" aria-label="Editar número ${index + 1}">
    `;
    editarNumerosContainer.appendChild(numeroItem);
  });

  document.getElementById('editar-mensaje').value = mensaje || '';
}


