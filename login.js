import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { firebaseConfig } from "./firebase.js"; // tu archivo con las credenciales

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Manejar envío del formulario
document.getElementById("login-form").addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      // Login exitoso
      window.location.href = "panel.html"; // redirige al panel
    })
    .catch((error) => {
      document.getElementById("error-message").textContent = "Error: " + error.message;
    });
});
