import { auth } from "./firebase.js";

// Manejar envío del formulario
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    console.log("Usuario logueado:", userCredential.user);
    window.location.href = "panel.html"; // Redirige al panel
  } catch (error) {
    console.error("Error al iniciar sesión:", error.message);
    document.getElementById("error-message").textContent = "Error: " + error.message;
  }
});
