// Configuração do Firebase (Opcional: Preencha caso queira login na nuvem)
const firebaseConfig = {
  apiKey: "SEU_API_KEY",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123:web:abc"
};

let db = null;
let auth = null;
let currentUser = null;
let isFirebaseInitialized = false;

try {
  if (firebaseConfig.apiKey !== "SEU_API_KEY") {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    isFirebaseInitialized = true;
  }
} catch (e) {
  console.log("Modo local ativo.");
}

// Estado Local
let gastos = JSON.parse(localStorage.getItem('space_bibi_gastos')) || [];
let reports = JSON.parse(localStorage.getItem('space_bibi_reports')) || [];

function atualizarDados() {
  renderizarGeral();
  if (!isFirebaseInitialized || !currentUser) {
    localStorage.setItem('space_bibi_gastos', JSON.stringify(gastos));
    localStorage.setItem('space_bibi_reports', JSON.stringify(reports));
  }
}

function renderizarGeral() {
  const total = gastos.reduce((acc, g) => acc + g.valor, 0);
  
  // Home
  document.getElementById('home-total-gasto').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
  document.getElementById('home-total-reports').innerText = reports.length;

  // Financeiro
  document.getElementById('fin-total').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
  document.getElementById('fin-registros').innerText = gastos.length;

  // Lista Financeiro & Home Recentes
  const listaG = document.getElementById('lista-gastos');
  const homeRec = document.getElementById('home-recentes');
  
  if (gastos.length === 0) {
    listaG.innerHTML = '<p class="text-xs text-center text-slate-400 py-3">Nenhum gasto registrado.</p>';
    homeRec.innerHTML = '<p class="text-xs text-slate-400 text-center py-3">Nenhuma atividade recente.</p>';
    return;
  }

  let htmlGastos = '';
  let htmlHome = '';

  gastos.slice(0, 5).forEach((g, index) => {
    const cardHtml = `
      <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
        <div>
          <p class="font-bold text-slate-800">${g.desc}</p>
          <p class="text-[10px] text-slate-500">${g.data} • <span class="text-pink-600 font-semibold">${g.cat}</span> (${g.divisao})</p>
          ${g.drive ? `<a href="${g.drive}" target="_blank" class="text-[10px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5"><i data-lucide="external-link" class="w-3 h-3"></i> Comprovante</a>` : ''}
        </div>
        <div class="flex items-center gap-2">
          <span class="font-black text-slate-900">R$ ${g.valor.toFixed(2).replace('.', ',')}</span>
          <button onclick="removerGasto(${g.id})" class="text-slate-400 hover:text-red-500"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
        </div>
      </div>
    `;
    htmlGastos += cardHtml;
    if (index < 3) htmlHome += cardHtml;
  });

  listaG.innerHTML = htmlGastos;
  homeRec.innerHTML = htmlHome;
  lucide.createIcons();
}

function adicionarGasto() {
  const desc = document.getElementById('gasto-desc').value.trim();
  const valor = parseFloat(document.getElementById('gasto-valor').value);
  const cat = document.getElementById('gasto-cat').value;
  const divisao = document.getElementById('gasto-divisao').value;
  const drive = document.getElementById('gasto-drive').value.trim();

  if (!desc || isNaN(valor) || valor <= 0) {
    alert('Preencha a descrição e um valor válido.');
    return;
  }

  const novo = { id: Date.now(), data: new Date().toLocaleDateString('pt-BR'), desc, valor, cat, divisao, drive };
  gastos.unshift(novo);
  atualizarDados();

  document.getElementById('gasto-desc').value = '';
  document.getElementById('gasto-valor').value = '';
  document.getElementById('gasto-drive').value = '';
}

function removerGasto(id) {
  gastos = gastos.filter(g => g.id !== id);
  atualizarDados();
}

function exportarCSV() {
  if (gastos.length === 0) return alert('Sem dados para exportar.');
  let csv = 'Data;Descrição;Categoria;Valor;Divisão;Drive\n';
  gastos.forEach(g => { csv += `${g.data};"${g.desc}";${g.cat};${g.valor.toFixed(2)};${g.divisao};${g.drive || ''}\n`; });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', 'gastos_space_bibi.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function gerarReportWhatsApp() {
  const dataStr = document.getElementById('rotina-data').value;
  const ref = document.getElementById('check-refeicao').checked ? '✅ OK' : '❌ Pendente';
  const rem = document.getElementById('check-remedio').checked ? '✅ OK' : '❌ Pendente';
  const lic = document.getElementById('check-licao').checked ? '✅ OK' : '❌ Pendente';
  const ban = document.getElementById('check-banho').checked ? '✅ OK' : '❌ Pendente';
  const obs = document.getElementById('rotina-obs').value.trim();

  const texto = `🌸 *REPORT DIÁRIO - SPACE DA BIBI* 🌸\n📅 Data: ${dataStr}\n\n*Rotina:*\n• Refeições: ${ref}\n• Medicamentos: ${rem}\n• Tarefas: ${lic}\n• Higiene: ${ban}\n\n*Obs:* ${obs || 'Tudo ótimo por aqui!'}`;
  
  reports.unshift({ id: Date.now(), data: dataStr, texto });
  atualizarDados();

  document.getElementById('texto-report').innerText = texto;
  document.getElementById('box-preview-report').classList.remove('hidden');
}

function copiarTextoReport() {
  navigator.clipboard.writeText(document.getElementById('texto-report').innerText);
  alert('Report copiado para o WhatsApp!');
}

// Autenticação Google
function toggleAuth() {
  if (!isFirebaseInitialized) {
    alert('Para ativar o login com Google e sincronização entre dispositivos, configure suas chaves do Firebase no arquivo config.js.');
    return;
  }
  if (!currentUser) {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => alert(err.message));
  } else {
    auth.signOut();
  }
}

if (isFirebaseInitialized) {
  auth.onAuthStateChanged(user => {
    currentUser = user;
    if (user) {
      document.getElementById('user-status').innerText = user.displayName || user.email;
      document.getElementById('auth-btn-text').innerText = 'Sair';
    } else {
      document.getElementById('user-status').innerText = 'Modo Local (Offline)';
      document.getElementById('auth-btn-text').innerText = 'Entrar / Sincronizar';
    }
  });
}

renderizarGeral();