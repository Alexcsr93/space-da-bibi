// Cole aqui o ID do Cliente extraído do seu arquivo JSON do OAuth:
const CLIENT_ID = '906116760120-qolkugei40su4j95u56m0u0oa4804i1i.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient;
let gapiInited = false;
let gInited = false;
let driveAccessToken = null;

function gapiLoaded() {
  gapi.load('client', async () => {
    await gapi.client.init({
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
    });
    gapiInited = true;
  });
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: (resp) => {
      if (resp.error) return alert('Erro ao autenticar no Google Drive: ' + resp.error);
      driveAccessToken = resp.access_token;
      document.getElementById('drive-status').innerText = "Drive Conectado!";
      alert('Google Drive conectado com sucesso!');
    },
  });
  gInited = true;
}

function conectarGoogleDrive() {
  if (tokenClient) {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    alert('As bibliotecas do Google ainda estão carregando. Tente novamente em alguns segundos.');
  }
}

// Estados Locais
let gastos = JSON.parse(localStorage.getItem('space_bibi_gastos')) || [];
let reports = JSON.parse(localStorage.getItem('space_bibi_reports')) || [];

async function tratarFotoDrive(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!driveAccessToken) {
    alert('Por favor, clique em "Conectar Drive" no topo antes de enviar o comprovante.');
    return;
  }

  document.getElementById('file-label-text').innerText = "Enviando pro Drive...";

  try {
    // 1. Upload do arquivo
    const metadata = {
      name: `Comprovante_Bibi_${Date.now()}_${file.name}`,
      mimeType: file.type
    };

    const formData = new FormData();
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    formData.append('file', file);

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink', {
      method: 'POST',
      headers: new Headers({ 'Authorization': 'Bearer ' + driveAccessToken }),
      body: formData
    });

    const data = await res.json();

    if (data.id && data.webViewLink) {
      // 2. Tornar o arquivo público para visualização com o link
      await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
        method: 'POST',
        headers: new Headers({
          'Authorization': 'Bearer ' + driveAccessToken,
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone'
        })
      });

      document.getElementById('gasto-drive').value = data.webViewLink;
      document.getElementById('file-label-text').innerText = "Foto enviada!";
      alert('Foto enviada e liberada com sucesso no seu Google Drive!');
    } else {
      throw new Error('Não foi possível obter o link do arquivo.');
    }
  } catch (err) {
    console.error(err);
    alert('Erro ao enviar foto para o Drive: ' + err.message);
    document.getElementById('file-label-text').innerText = "Erro no upload";
  }
}

function renderizarGeral() {
  const total = gastos.reduce((acc, g) => acc + g.valor, 0);
  
  document.getElementById('home-total-gasto').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
  document.getElementById('home-total-reports').innerText = reports.length;
  document.getElementById('fin-total').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
  document.getElementById('fin-registros').innerText = gastos.length;

  const listaG = document.getElementById('lista-gastos');
  const homeRec = document.getElementById('home-recentes');
  const listaRep = document.getElementById('lista-reports');

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
            ${g.drive ? `<a href="${g.drive}" target="_blank" class="text-[10px] text-blue-600 hover:underline flex items-center gap-1 mt-0.5"><i data-lucide="external-link" class="w-3 h-3"></i> Abrir Comprovante no Drive</a>` : ''}
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
  }

  if (reports.length === 0) {
    listaRep.innerHTML = '<p class="text-xs text-center text-slate-400 py-3">Nenhum report salvo ainda.</p>';
  } else {
    let htmlReports = '';
    reports.forEach(r => {
      htmlReports += `
        <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
          <div class="flex justify-between items-center font-bold text-purple-900">
            <span>📅 ${r.data} (Escola: ${r.escola})</span>
            <button onclick="removerReport(${r.id})" class="text-slate-400 hover:text-red-500"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
          </div>
          <p class="text-slate-600 text-[11px] whitespace-pre-line">${r.texto}</p>
        </div>
      `;
    });
    listaRep.innerHTML = htmlReports;
  }

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
  
  localStorage.setItem('space_bibi_gastos', JSON.stringify(gastos));
  renderizarGeral();

  document.getElementById('gasto-desc').value = '';
  document.getElementById('gasto-valor').value = '';
  document.getElementById('gasto-drive').value = '';
  document.getElementById('file-label-text').innerText = 'Tirar Foto / Arquivo';
  alert('Gasto salvo e comprovante vinculado!');
}

function removerGasto(id) {
  gastos = gastos.filter(g => g.id !== id);
  localStorage.setItem('space_bibi_gastos', JSON.stringify(gastos));
  renderizarGeral();
}

function removerReport(id) {
  reports = reports.filter(r => r.id !== id);
  localStorage.setItem('space_bibi_reports', JSON.stringify(reports));
  renderizarGeral();
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

function salvarEGerarReport() {
  const dataStr = document.getElementById('rotina-data').value;
  const escola = document.getElementById('rotina-escola').value;
  const ref = document.getElementById('check-refeicao').checked ? '✅ OK' : '❌ Pendente';
  const rem = document.getElementById('check-remedio').checked ? '✅ OK' : '❌ Pendente';
  const lic = document.getElementById('check-licao').checked ? '✅ OK' : '❌ Pendente';
  const ban = document.getElementById('check-banho').checked ? '✅ OK' : '❌ Pendente';
  const obs = document.getElementById('rotina-obs').value.trim();

  const texto = `🌸 *REPORT DIÁRIO - SPACE DA BIBI* 🌸\n📅 Data: ${dataStr} | Escola: ${escola}\n\n*Rotina:*\n• Refeições: ${ref}\n• Medicamentos: ${rem}\n• Tarefas: ${lic}\n• Higiene: ${ban}\n\n*Obs:* ${obs || 'Tudo ótimo por aqui!'}`;
  
  reports.unshift({ id: Date.now(), data: dataStr, escola, texto });
  localStorage.setItem('space_bibi_reports', JSON.stringify(reports));
  renderizarGeral();

  document.getElementById('texto-report').innerText = texto;
  document.getElementById('box-preview-report').classList.remove('hidden');
  
  const encodedText = encodeURIComponent(texto);
  document.getElementById('whatsapp-link').href = `https://api.whatsapp.com/send?text=${encodedText}`;
}

function copiarTextoReport() {
  navigator.clipboard.writeText(document.getElementById('texto-report').innerText);
  alert('Report copiado para o WhatsApp!');
}

renderizarGeral();