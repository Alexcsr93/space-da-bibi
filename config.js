// Estados Locais / Nuvem
let gastos = JSON.parse(localStorage.getItem('space_bibi_gastos')) || [];
let reports = JSON.parse(localStorage.getItem('space_bibi_reports')) || [];
let arquivoFotoParaEnviar = null;

// Capturar a foto selecionada
window.tratarFotoDrive = function(event) {
  const file = event.target.files[0];
  if (!file) return;
  arquivoFotoParaEnviar = file;
  document.getElementById('file-label-text').innerText = "Foto pronta para envio!";
}

// Função auxiliar para enviar a imagem para um servidor de nuvem público e seguro via API
async function enviarImagemParaNuvem(file) {
  const formData = new FormData();
  formData.append("image", file);

  // Usando uma API pública gratuita e segura para hospedagem temporária/permanente de recibos
  const response = await fetch("https://api.imgbb.com/1/upload?key=6d2038744d03d4060872288340798b11", {
    method: "POST",
    body: formData
  });

  const data = await response.json();
  if (data && data.success) {
    return data.data.url; // Retorna o link direto da imagem na nuvem
  } else {
    throw new Error("Falha ao enviar a imagem.");
  }
}

window.renderizarGeral = function() {
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
              ${g.drive ? `<a href="${g.drive}" target="_blank" class="text-[10px] text-pink-600 hover:underline flex items-center gap-1 mt-0.5"><i data-lucide="image" class="w-3 h-3"></i> Ver Comprovante na Nuvem</a>` : ''}
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
              <button onclick="removerReport(${r.id})" class="text-slate-400 hover:text-red-500"><i data-lucide="trash-2" class="w-3.5 h-3.5"></i></button>
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

window.adicionarGasto = async function() {
  const desc = document.getElementById('gasto-desc').value.trim();
  const valor = parseFloat(document.getElementById('gasto-valor').value);
  const cat = document.getElementById('gasto-cat').value;
  const divisao = document.getElementById('gasto-divisao').value;

  if (!desc || isNaN(valor) || valor <= 0) {
    alert('Preencha a descrição e um valor válido.');
    return;
  }

  let imageUrl = "";
  if (arquivoFotoParaEnviar) {
    document.getElementById('file-label-text').innerText = "Enviando foto para a nuvem...";
    try {
      imageUrl = await enviarImagemParaNuvem(arquivoFotoParaEnviar);
    } catch (err) {
      console.error(err);
      alert('Erro ao enviar a foto. O gasto será salvo sem imagem.');
    }
  }

  const novo = { 
    id: Date.now(), 
    data: new Date().toLocaleDateString('pt-BR'), 
    desc, 
    valor, 
    cat, 
    divisao, 
    drive: imageUrl 
  };
  
  gastos.unshift(novo);
  localStorage.setItem('space_bibi_gastos', JSON.stringify(gastos));
  renderizarGeral();

  document.getElementById('gasto-desc').value = '';
  document.getElementById('gasto-valor').value = '';
  arquivoFotoParaEnviar = null;
  document.getElementById('file-label-text').innerText = 'Tirar Foto / Arquivo';
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

window.salvarEGerarReport = function() {
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

window.copiarTextoReport = function() {
  navigator.clipboard.writeText(document.getElementById('texto-report').innerText);
  alert('Report copiado para o WhatsApp!');
}

renderizarGeral();