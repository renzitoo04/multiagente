// filepath: c:\Users\Renzo\OneDrive\Escritorio\multiagente\firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBvzwAiEwWds_WnC_5Gfk_-ZN6PGfMrmD4",
  authDomain: "multiagente-login.firebaseapp.com",
  projectId: "multiagente-login",
  storageBucket: "multiagente-login.appspot.com", // Corrige el dominio del storage
  messagingSenderId: "298638656074",
  appId: "1:298638656074:web:f4610a9dbbde82ea409cb3",
  measurementId: "G-86LQC6LLPD"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);