import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { firebaseConfig } from "./firebase.js";

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Detectar usuario logueado
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const uid = user.uid;
    const userDocRef = doc(db, "usuarios", uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      const maxNumeros = data.maxNumeros || 0;
      const container = document.getElementById("numero-container");

      if (maxNumeros === 0) {
        document.getElementById("mensaje").textContent = "No tenés números disponibles. Contactanos para adquirir más.";
        return;
      }

      for (let i = 0; i < maxNumeros; i++) {
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = `Número ${i + 1}`;
        container.appendChild(input);
        container.appendChild(document.createElement("br"));
      }

    } else {
      document.getElementById("mensaje").textContent = "Usuario no encontrado en la base de datos.";
    }
  } else {
    window.location.href = "login.html"; // redirigir si no está logueado
  }
});
