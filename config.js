import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Suas credenciais do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAPy71ptJA67PBVOcBdlBs5a9Mwcl8dVkA",
  authDomain: "spacedabibi.firebaseapp.com",
  projectId: "spacedabibi",
  storageBucket: "spacedabibi.firebasestorage.app",
  messagingSenderId: "548941959127",
  appId: "1:548941959127:web:868af2e93fcf1e43fac592"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

let gastos = [];
let reports = [];
let arquivoFotoParaEnviar = null;

// Capturar a foto selecionada
window.tratarFotoDrive = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  arquivoFotoParaEnviar = file;
  document.getElementById('file-label-text').innerText = "Foto selecionada (Pronta para envio)";
}

// Ouvir dados em tempo real do Firestore
onSnapshot(collection(db, "gastos"), (snapshot) => {
  gastos = snapshot.docs.map(doc => ({ idDoc: doc.id, ...doc.data() }));
  renderizarGeral();
});

onSnapshot(collection(db, "reports"), (snapshot) => {
  reports = snapshot.docs.map(doc => ({ idDoc: doc.id, ...doc.data() }));
  renderizarGeral();
});

window.adicionarGasto = async function() {
  const desc = document.getElementById('gasto-desc').value.trim();
  const valor = parseFloat(document.getElementById('gasto-valor').value);
  const cat = document.getElementById('gasto-cat').value;
  const divisao = document.getElementById('gasto-divisao').value;

  if (!desc || isNaN(valor) || valor <= 0) {
    alert('Preencha a descrição e um valor válido.');
    return;
  }

  let driveUrl = "";
  document.getElementById('file-label-text').innerText = "Salvando na nuvem...";

  try {
    // Se houver foto, envia para o Firebase Storage
    if (arquivoFotoParaEnviar) {
      const storageRef = ref(storage, `comprovantes/${Date.now()}_${arquivoFotoParaEnviar.name}`);
      const snapshot = await uploadBytes(storageRef, arquivoFotoParaEnviar);
      driveUrl = await getDownloadURL(snapshot.ref);
    }

    // Salva o gasto no Firestore
    await addDoc(collection(db, "gastos"), {
      id: Date.now(),
      data: new Date().toLocaleDateString('pt-BR'),
      desc,
      valor,
      cat,
      divisao,
      drive: driveUrl
    });

    document.getElementById('gasto-desc').value = '';
    document.getElementById('gasto-valor').value = '';
    arquivoFotoParaEnviar = null;
    document.getElementById('file-label-text').innerText = 'Tirar Foto / Arquivo';
    alert('Gasto e comprovante salvos na nuvem com sucesso!');
  } catch (err) {
    console.error(err);
    alert('Erro ao salvar gasto: ' + err.message);
    document.getElementById('file-label-text').innerText = 'Erro no envio';
  }
}

window.removerGasto = async function(idDoc) {
  if (confirm('Deseja realmente excluir este gasto?')) {
    await deleteDoc(doc(db, "gastos", idDoc));
  }
}

window.salvarEGerarReport = async function() {
  const dataStr = document.getElementById('rotina-data').value;
  const escola = document.getElementById('rotina-escola').value;
  const ref = document.getElementById('check-refeicao').checked ? '✅ OK' : '❌ Pendente';
  const rem = document.getElementById('check-remedio').checked ? '✅ OK' : '❌ Pendente';
  const lic = document.getElementById('check-licao').checked ? '✅ OK' : '❌ Pendente';
  const ban = document.getElementById('check-banho').checked ? '✅ OK' : '❌ Pendente';
  const obs = document.getElementById('rotina-obs').value.trim();

  const texto = `🌸 *REPORT DIÁRIO - SPACE DA BIBI* 🌸\n📅 Data: ${dataStr} | Escola: ${escola}\n\n*Rotina:*\n• Refeições: ${ref}\n• Medicamentos: ${rem}\n• Tarefas: ${lic}\n• Higiene: ${ban}\n\n*Obs:* ${obs || 'Tudo ótimo por aqui!'}`;
  
  await addDoc(collection(db, "reports"), {
    id: Date.now(),
    data: dataStr,
    escola,
    texto
  });

  document.getElementById('texto-report').innerText = texto;
  document.getElementById('box-preview-report').classList.remove('hidden');
  
  const encodedText = encodeURIComponent(texto);
  document.getElementById('whatsapp-link').href = `https://api.whatsapp.com/send?text=${encodedText}`;
}

window.removerReport = async function(idDoc) {
  if (confirm('Deseja excluir este report?')) {
    await deleteDoc(doc(db, "reports", idDoc));
  }
}

function renderizarGeral() {
  const total = gastos.reduce((acc, g) => acc + (g.valor || 0), 0);
  
  if(document.getElementById('home-total-gasto')) document.getElementById('home-total-gasto').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
  if(document.getElementById('home-total-reports')) document.getElementById('home-total-reports').innerText = reports.length;
  if(document.getElementById('fin-total')) document.getElementById('fin-total').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
  if(document.getElementById('fin-registros')) document.getElementById('fin-registros').innerText = gastos.length;

  const listaG = document.getElementById('lista-gastos');
  const homeRec = document.getElementById('home-recentes');
  const listaRep = document.getElementById('lista-reports');

  if (listaG && homeRec) {
    if (gastos.length === 0) {
      listaG.innerHTML = '<p class="text-xs text-center text-slate-400 py-3">Nenhum gasto registrado.</p>';
      homeRec.innerHTML = '<p class="text-xs text-slate-400 text-center py-3">Nenhuma atividade recente.</p>';
    } else {
      let htmlGastos = '';
      let htmlHome = '';
      gastos.slice(0, 5).forEach((g, index) => {
        const cardHtml = `
          <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div>
              <p class="font-bold text-slate-800">${g.desc}</p>
              <p class="text-[10px] text-slate-500">${g.data} • <span class="text-pink-600 font-semibold">${g.cat}</span> (${g.divisao})</p>
              ${g.drive ? `<a href="${g.drive}" target="_blank" class="text-[10px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5"><i data-lucide="external-link" class="w-3 h-3"></i> Abrir Comprovante na Nuvem</a>` : ''}
            </div>
            <div class="flex items-center gap-2">
              <span class="font-black text-slate-900">R$ ${g.valor.toFixed(2).replace('.', ',')}</span>
              <button onclick="removerGasto('${g.idDoc}')" class="text-slate-400 hover:text-red-500"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
            </div>
          </div>
        `;
        htmlGastos += cardHtml;
        if (index < 3) htmlHome += cardHtml;
      });
      listaG.innerHTML = htmlGastos;
      homeRec.innerHTML = htmlHome;
    }
  }

  if (listaRep) {
    if (reports.length === 0) {
      listaRep.innerHTML = '<p class="text-xs text-center text-slate-400 py-3">Nenhum report salvo ainda.</p>';
    } else {
      let htmlReports = '';
      reports.forEach(r => {
        htmlReports += `
          <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
            <div class="flex justify-between items-center font-bold text-purple-900">
              <span>📅 ${r.data} (Escola: ${r.escola})</span>
              <button onclick="removerReport('${r.idDoc}')" class="text-slate-400 hover:text-red-500"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
            </div>
            <p class="text-slate-600 text-[11px] whitespace-pre-line">${r.texto}</p>
          </div>
        `;
      });
      listaRep.innerHTML = htmlReports;
    }
  }

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

window.exportarCSV = function() {
  if (gastos.length === 0) return alert('Sem dados para exportar.');
  let csv = 'Data;Descrição;Categoria;Valor;Divisão;Comprovante\n';
  gastos.forEach(g => { csv += `${g.data};"${g.desc}";${g.cat};${g.valor.toFixed(2)};${g.divisao};${g.drive || ''}\n`; });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', 'gastos_space_bibi.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

window.copiarTextoReport = function() {
  navigator.clipboard.writeText(document.getElementById('texto-report').innerText);
  alert('Report copiado para o WhatsApp!');
}