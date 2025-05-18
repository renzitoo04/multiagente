import { auth } from './firebase.js';
import { signInWithEmailAndPassword } from "firebase/auth";

document.getElementById('login-form').addEventListener('submit', async (event) => {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("Usuario logueado:", user.email);
    window.location.href = 'panel.html'; // Redirige al panel
  } catch (error) {
    console.error("Error al iniciar sesión:", error.message);
    document.getElementById('error-message').textContent = "Error: " + error.message;
  }
});

