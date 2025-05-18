// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyD4FEIDXnzrA14Ilzp6gjj3MgsFt4w8Rxw",
  authDomain: "watlikn.firebaseapp.com",
  projectId: "watlikn",
  storageBucket: "watlikn.appspot.com",
  messagingSenderId: "15043561405",
  appId: "1:15043561405:web:fcf70add38abb37497f4d4",
  measurementId: "G-N073G83V7M"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Verificar si el usuario está autenticado
auth.onAuthStateChanged(async (user) => {
  if (user) {
    const docRef = db.collection("usuarios").doc(user.uid);
    const docSnap = await docRef.get();

    if (docSnap.exists) {
      const datosUsuario = docSnap.data();
      document.getElementById("contenido").innerHTML = `
        <h1>Bienvenido, ${datosUsuario.email}</h1>
        <p>Límite de números: ${datosUsuario.limiteNumeros}</p>
      `;
    } else {
      console.log("No se encontraron datos del usuario");
    }
  } else {
    window.location.href = "login.html"; // Redirige al login si no está autenticado
  }
});
