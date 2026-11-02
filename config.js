// Importações da biblioteca de Autenticação do Firebase SDK
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

const firebaseConfig = {
  apiKey: "AIzaSyAPy71ptJA67PBVOcBdlBs5a9Mwcl8dVkA",
  authDomain: "spacedabibi.firebaseapp.com",
  projectId: "spacedabibi",
  storageBucket: "spacedabibi.firebasestorage.app",
  messagingSenderId: "548941959127",
  appId: "1:548941959127:web:868af2e93fcf1e43fac592"
};

// Inicialização do Firebase Auth
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Função para efetuar login com a conta do Google via Popup
window.loginComGoogle = function() {
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      console.log("Logado com sucesso:", user.displayName);
      atualizarUIUsuario(user);
    })
    .catch((error) => {
      console.error("Erro no login com Google:", error);
      alert("Erro ao realizar o login com a conta do Google.");
    });
};

// Função para Deslogar
window.logoutGoogle = function() {
  signOut(auth).then(() => {
    atualizarUIUsuario(null);
  });
};

// Monitorar estado da Autenticação em Tempo Real
onAuthStateChanged(auth, (user) => {
  if (user) {
    atualizarUIUsuario(user);
  } else {
    atualizarUIUsuario(null);
  }
});

// Função para atualizar a interface com os dados da conta logada
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