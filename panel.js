import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const docRef = doc(db, "usuarios", user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const datosUsuario = docSnap.data();
      document.body.innerHTML = `<h1>Bienvenido, ${datosUsuario.email}</h1>
        <p>Límite de números: ${datosUsuario.limiteNumeros}</p>`;
    } else {
      console.log('No se encontraron datos del usuario');
    }
  } else {
    window.location.href = 'login.html'; // Redirige al login si no está autenticado
  }
});
