// Space da Bibi - Configuração Estável e Definitiva
let gastos = JSON.parse(localStorage.getItem('space_bibi_gastos')) || [];
let reports = JSON.parse(localStorage.getItem('space_bibi_reports')) || [];

window.tratarFotoDrive = function(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const hiddenInput = document.getElementById('gasto-drive');
    if (hiddenInput) hiddenInput.value = e.target.result;
    const labelText = document.getElementById('file-label-text');
    if (labelText) labelText.innerText = "Foto anexada!";
  };
  reader.readAsDataURL(file);
}

window.renderizarGeral = function() {
  const total = gastos.reduce((acc, g) => acc + (g.valor || 0), 0);
  
  if(document.getElementById('home-total-gasto')) document.getElementById('home-total-gasto').innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
  if(document.getElementById('fin-registros')) document.getElementById('fin-registros').innerText = gastos.length;

  const listaG = document.getElementById('lista-gastos');
  const listaRep = document.getElementById('lista-reports');

  if (listaG) {
    if (gastos.length === 0) {
      listaG.innerHTML = '<p class="text-xs text-center text-slate-400 py-3">Nenhum gasto registrado.</p>';
    } else {
      let htmlGastos = '';
      gastos.forEach((g) => {
        htmlGastos += `
          <div class="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
            <div>
              <p class="font-bold text-slate-800">${g.desc}</p>
              <p class="text-[10px] text-slate-500">${g.data} • <span class="text-pink-600 font-semibold">${g.cat}</span> (${g.divisao})</p>
              ${g.drive ? `<a href="${g.drive}" target="_blank" class="text-[10px] text-pink-600 hover:underline flex items-center gap-1 mt-0.5"><i data-lucide="image" class="w-3 h-3"></i> Ver Comprovante</a>` : ''}
            </div>
            <div class="flex items-center gap-2">
              <span class="font-black text-slate-900">R$ ${g.valor.toFixed(2).replace('.', ',')}</span>
              <button onclick="removerGasto(${g.id})" class="text-slate-400 hover:text-red-500 p-1"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
            </div>
          </div>
        `;
      });
      listaG.innerHTML = htmlGastos;
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
              <button onclick="removerReport(${r.id})" class="text-slate-400 hover:text-red-500 p-1"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
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

window.adicionarGasto = function() {
  const descElem = document.getElementById('gasto-desc');
  const valorElem = document.getElementById('gasto-valor');
  const catElem = document.getElementById('gasto-cat');
  const divisaoElem = document.getElementById('gasto-divisao');
  const driveElem = document.getElementById('gasto-drive');

  if (!descElem || !valorElem) return;

  const desc = descElem.value.trim();
  const valor = parseFloat(valorElem.value);
  const cat = catElem ? catElem.value : 'Outros';
  const divisao = divisaoElem ? divisaoElem.value : 'Dividido 50/50';
  const drive = driveElem ? driveElem.value.trim() : '';

  if (!desc || isNaN(valor) || valor <= 0) {
    alert('Preencha a descrição e um valor válido.');
    return;
  }

  const novo = { id: Date.now(), data: new Date().toLocaleDateString('pt-BR'), desc, valor, cat, divisao, drive };
  gastos.unshift(novo);
  
  localStorage.setItem('space_bibi_gastos', JSON.stringify(gastos));
  renderizarGeral();

  descElem.value = '';
  valorElem.value = '';
  if (driveElem) driveElem.value = '';
  const labelText = document.getElementById('file-label-text');
  if (labelText) labelText.innerText = 'Tirar Foto';
  
  alert('Gasto salvo com sucesso!');
}

window.removerGasto = function(id) {
  gastos = gastos.filter(g => g.id !== id);
  localStorage.setItem('space_bibi_gastos', JSON.stringify(gastos));
  renderizarGeral();
}

window.removerReport = function(id) {
  reports = reports.filter(r => r.id !== id);
  localStorage.setItem('space_bibi_reports', JSON.stringify(reports));
  renderizarGeral();
}

window.exportarCSV = function() {
  if (gastos.length === 0) return alert('Sem dados para exportar.');
  let csv = "Data;Descrição;Categoria;Valor;Divisão\n";
  gastos.forEach(g => { csv += `${g.data};"${g.desc}";${g.cat};${g.valor.toFixed(2)};${g.divisao}\n`; });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.setAttribute('download', 'gastos_space_bibi.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

window.salvarEGerarReport = function() {
  const dataElem = document.getElementById('rotina-data');
  const escolaElem = document.getElementById('rotina-escola');
  if (!dataElem || !escolaElem) return;

  const dataStr = dataElem.value || new Date().toLocaleDateString('pt-BR');
  const escola = escolaElem.value || 'Escola';
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

window.copiarTextoReport = function() {
  const txt = document.getElementById('texto-report').innerText;
  navigator.clipboard.writeText(txt);
  alert('Report copiado para a área de transferência!');
}

document.addEventListener('DOMContentLoaded', () => {
  const hoje = new Date().toISOString().split('T')[0];
  if (document.getElementById('rotina-data')) {
    document.getElementById('rotina-data').value = hoje;
  }
  renderizarGeral();
});