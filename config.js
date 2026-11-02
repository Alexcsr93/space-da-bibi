// Configuração do Firebase & Autenticação Google
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyAPy71ptJA67PBVOcBdlBs5a9Mwcl8dVkA",
  authDomain: "spacedabibi.firebaseapp.com",
  projectId: "spacedabibi",
  storageBucket: "spacedabibi.firebasestorage.app",
  messagingSenderId: "548941959127",
  appId: "1:548941959127:web:868af2e93fcf1e43fac592"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Funções globais de Login e Logout
window.loginComGoogle = function() {
  signInWithPopup(auth, provider)
    .then((result) => {
      console.log("Usuário logado:", result.user);
      atualizarUIUsuario(result.user);
    })
    .catch((error) => {
      console.error("Erro no login:", error);
      alert("Erro ao realizar o login com o Google. Verifique se o domínio alexcsr93.github.io está autorizado no Firebase.");
    });
};

window.logoutGoogle = function() {
  signOut(auth).then(() => {
    atualizarUIUsuario(null);
  });
};

// Monitora o login do usuário
onAuthStateChanged(auth, (user) => {
  atualizarUIUsuario(user);
});

function atualizarUIUsuario(user) {
  const btnLogin = document.getElementById('btn-login-google');
  const userInfo = document.getElementById('user-info');
  const userPhoto = document.getElementById('user-photo');

  if (user) {
    if (btnLogin) btnLogin.classList.add('hidden');
    if (userInfo) userInfo.classList.remove('hidden');
    if (userPhoto) userPhoto.src = user.photoURL || 'https://cdn-icons-png.flaticon.com/512/3082/3082060.png';
  } else {
    if (btnLogin) btnLogin.classList.remove('hidden');
    if (userInfo) userInfo.classList.add('hidden');
  }
}