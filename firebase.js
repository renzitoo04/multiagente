/// firebase.js (modular)
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD4FEIDXnzrA14Ilzp6gjj3MgsFt4w8Rxw",
  authDomain: "watlikn.firebaseapp.com",
  projectId: "watlikn",
  storageBucket: "watlikn.appspot.com", // Cambié firebasestorage.app a appspot.com
  messagingSenderId: "15043561405",
  appId: "1:15043561405:web:fcf70add38abb37497f4d4",
  measurementId: "G-N073G83V7M"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Función para iniciar sesión
async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Usuario logueado:", userCredential.user);
  } catch (error) {
    console.error("Error al iniciar sesión:", error.message);
  }
}

// Exportar las instancias y funciones para usarlas en otros archivos
export { auth, db, login };
