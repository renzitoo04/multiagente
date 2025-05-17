// filepath: c:\Users\Renzo\OneDrive\Escritorio\multiagente\firebase.js
import firebase from "firebase/app";
import "firebase/auth";
import "firebase/firestore";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBvzwAiEwWds_WnC_5Gfk_-ZN6PGfMrmD4",
  authDomain: "multiagente-login.firebaseapp.com",
  projectId: "multiagente-login",
  storageBucket: "multiagente-login.appspot.com",
  messagingSenderId: "298638656074",
  appId: "1:298638656074:web:f4610a9dbbde82ea409cb3",
  measurementId: "G-86LQC6LLPD"
};

// Inicializar Firebase
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Exportar las instancias para usarlas en otros archivos
export { auth, db };