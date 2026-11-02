// Space da Bibi - Estado & Persistência Local
let gastos = JSON.parse(localStorage.getItem('space_bibi_gastos')) || [];
let reports = JSON.parse(localStorage.getItem('space_bibi_reports')) || [];

document.addEventListener('DOMContentLoaded', () => {
  const hoje = new Date().toISOString().split('T')[0];
  const mesAtual = hoje.substring(0, 7);
  
  if (document.getElementById('gasto-data')) document.getElementById('gasto-data').value = hoje;
  if (document.getElementById('rotina-data')) document.getElementById('rotina-data').value = hoje;
  if (document.getElementById('filtro-mes')) document.getElementById('filtro-mes').value = mesAtual;

  renderizarGeral();
});

function trocarAba(aba) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById(`aba-${aba}`).classList.remove('hidden');

  const btns = ['inicio', 'financeiro', 'rotina'];
  btns.forEach(b => {
    const btn = document.getElementById(`btn-${b}`);
    if (b === aba) {
      btn.className = 'flex flex-col items-center justify-center py-1.5 text-pink-500 font-bold text-[10px]';
    } else {
      btn.className = 'flex flex-col items-center justify-center py-1.5 text-slate-400 font-medium text-[10px]';
    }
  });
}

function adicionarGasto(e) {
  e.preventDefault();
  const desc = document.getElementById('gasto-desc').value.trim();
  const valor = parseFloat(document.getElementById('gasto-valor').value);
  const cat = document.getElementById('gasto-cat').value;
  const data = document.getElementById('gasto-data').value;
  const divisao = document.getElementById('gasto-divisao').value;
  const fotoInput = document.getElementById('gasto-foto');

  if (!desc || isNaN(valor)) return alert('Preencha os campos obrigatórios!');

  const processarESalvar = (fotoBase64 = null) => {
    const novoGasto = {
      id: Date.now(),
      desc,
      valor,
      cat,
      data,
      divisao,
      foto: fotoBase64
    };

    gastos.unshift(novoGasto);
    localStorage.setItem('space_bibi_gastos', JSON.stringify(gastos));
    document.getElementById('form-gasto').reset();
    document.getElementById('gasto-data').value = new Date().toISOString().split('T')[0];
    renderizarGeral();
    alert('Despesa lançada com sucesso!');
  };

  if (fotoInput.files && fotoInput.files[0]) {
    const reader = new FileReader();
    reader.onload = function(event) {
      processarESalvar(event.target.result);
    };
    reader.readAsDataURL(fotoInput.files[0]);
  } else {
    processarESalvar();
  }
}

function renderizarGeral() {
  renderizarGastos();
  renderizarReports();
  atualizarDashboard();
}

function renderizarGastos() {
  const lista = document.getElementById('lista-gastos');
  if (!lista) return;

  const mesFiltro = document.getElementById('filtro-mes').value;
  const gastosFiltrados = mesFiltro ? gastos.filter(g => g.data.startsWith(mesFiltro)) : gastos;

  if (gastosFiltrados.length === 0) {
    lista.innerHTML = '<p class="text-xs text-slate-400 py-3 text-center">Nenhum gasto registrado neste mês.</p>';
    return;
  }

  lista.innerHTML = gastosFiltrados.map(g => `
    <div class="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
      <div class="space-y-0.5">
        <p class="text-xs font-bold text-slate-800">${g.desc}</p>
        <p class="text-[10px] text-slate-500">${g.data} • <span class="text-pink-600 font-medium">${g.cat}</span> • ${g.divisao}</p>
        ${g.foto ? `<button onclick="abrirModalFoto('${g.id}')" class="text-[10px] text-purple-600 underline font-semibold mt-1">Ver Comprovante</button>` : ''}
      </div>
      <div class="text-right">
        <p class="text-xs font-extrabold text-slate-800">R$ ${g.valor.toFixed(2)}</p>
        <button onclick="removerGasto(${g.id})" class="text-[10px] text-rose-400 hover:text-rose-600 mt-1">&times; Apagar</button>
      </div>
    </div>
  `).join('');
}

function abrirModalFoto(id) {
  const gasto = gastos.find(g => g.id == id);
  if (gasto && gasto.foto) {
    document.getElementById('img-modal').src = gasto.foto;
    document.getElementById('modal-foto').classList.remove('hidden');
  }
}

function fecharModalFoto() {
  document.getElementById('modal-foto').classList.add('hidden');
}

function removerGasto(id) {
  if (confirm('Deseja excluir este gasto?')) {
    gastos = gastos.filter(g => g.id !== id);
    localStorage.setItem('space_bibi_gastos', JSON.stringify(gastos));
    renderizarGeral();
  }
}

function salvarEGerarReport() {
  const dataStr = document.getElementById('rotina-data').value;
  const ref = document.getElementById('check-refeicao').checked ? '✅ OK' : '❌ Pendente';
  const rem = document.getElementById('check-remedio').checked ? '✅ OK' : '❌ Pendente';
  const lic = document.getElementById('check-licao').checked ? '✅ OK' : '❌ Pendente';
  const ban = document.getElementById('check-banho').checked ? '✅ OK' : '❌ Pendente';
  const obs = document.getElementById('rotina-obs').value.trim();

  const texto = `🌸 *REPORT DIÁRIO - SPACE DA BIBI* 🌸\n📅 Data: ${dataStr}\n\n*Rotina:*\n• Refeições: ${ref}\n• Medicamentos: ${rem}\n• Tarefas: ${lic}\n• Higiene: ${ban}\n\n*Obs:* ${obs || 'Tudo ótimo por aqui!'}`;

  reports.unshift({ id: Date.now(), data: dataStr, texto });
  localStorage.setItem('space_bibi_reports', JSON.stringify(reports));

  document.getElementById('texto-report').innerText = texto.replace(/\\n/g, '\n');
  document.getElementById('box-preview-report').classList.remove('hidden');
  
  const encodedText = encodeURIComponent(texto.replace(/\\n/g, '\n'));
  document.getElementById('whatsapp-link').href = `https://api.whatsapp.com/send?text=${encodedText}`;
  renderizarGeral();
}

function copiarTextoReport() {
  const txt = document.getElementById('texto-report').innerText;
  navigator.clipboard.writeText(txt);
  alert('Report copiado para o WhatsApp!');
}

function renderizarReports() {
  const lista = document.getElementById('lista-reports');
  if (!lista) return;

  if (reports.length === 0) {
    lista.innerHTML = '<p class="text-xs text-slate-400 py-3 text-center">Nenhum report registrado.</p>';
    return;
  }

  lista.innerHTML = reports.slice(0, 5).map(r => `
    <div class="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
      <div class="flex justify-between items-center text-xs font-bold text-slate-700">
        <span>📅 ${r.data}</span>
        <button onclick="removerReport(${r.id})" class="text-rose-400 text-[10px]">&times; Apagar</button>
      </div>
      <p class="text-[11px] text-slate-600 whitespace-pre-line leading-relaxed">${r.texto.replace(/\\n/g, '\n')}</p>
    </div>
  `).join('');
}

function removerReport(id) {
  if (confirm('Deseja excluir este report?')) {
    reports = reports.filter(r => r.id !== id);
    localStorage.setItem('space_bibi_reports', JSON.stringify(reports));
    renderizarGeral();
  }
}

function atualizarDashboard() {
  const hoje = new Date().toISOString().split('T')[0];
  const mesAtual = hoje.substring(0, 7);

  const gastosMes = gastos.filter(g => g.data.startsWith(mesAtual));
  const totalMes = gastosMes.reduce((acc, g) => acc + g.valor, 0);

  let papai = 0;
  let mamae = 0;

  gastosMes.forEach(g => {
    if (g.divisao === '50/50') {
      papai += g.valor / 2;
      mamae += g.valor / 2;
    } else if (g.divisao === '100% Papai') {
      papai += g.valor;
    } else if (g.divisao === '100% Mamãe') {
      mamae += g.valor;
    }
  });

  document.getElementById('dash-total-mes').innerText = `R$ ${totalMes.toFixed(2)}`;
  document.getElementById('dash-total-papai').innerText = `R$ ${papai.toFixed(2)}`;
  document.getElementById('dash-total-mamae').innerText = `R$ ${mamae.toFixed(2)}`;

  const reportsHojeCount = reports.filter(r => r.data === hoje).length;
  document.getElementById('dash-reports-hoje').innerText = reportsHojeCount;
}

function exportarCSV() {
  if (gastos.length === 0) return alert('Sem dados para exportar.');
  let csv = 'Data;Descrição;Categoria;Valor;Divisão\n';
  gastos.forEach(g => { csv += `${g.data};"${g.desc}";${g.cat};${g.valor.toFixed(2)};${g.divisao}\n`; });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', 'gastos_space_bibi.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function exportarBackupJSON() {
  const dados = { gastos, reports };
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', `space_bibi_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
