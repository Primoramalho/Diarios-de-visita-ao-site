/* ═══════════════════════════════════════════════════════════
   ESTADO GLOBAL
   ═══════════════════════════════════════════════════════════ */
const STORAGE_KEY = 'diarios_visita_metso_v3';
let dias = [];
let diaAtivoId = null;
let signatures = {};

const defaultHeader = {
  wo: "WO-130576",
  cliente: "Grupo Base Mineração LTDA | Extrabase unidade Jaguariúna-SP",
  equipamento: "HP4 CONE CRUSHER",
  noSerie: "HP4SOR0137",
  tecnico: "Primo Silva"
};

const defaultDia = () => ({
  id: gerarId(),
  data: new Date().toISOString().split('T')[0],
  normaisInicio: "08:00", normaisFinal: "17:00",
  extras50Inicio: "17:00", extras50Final: "19:00",
  extras100Inicio: "", extras100Final: "",
  descricao: "",
  nomeTecnicoDet: "", cargoTecnico: "", contatoTecnico: "",
  nomeClienteDet: "", cargoCliente: "", contatoCliente: "",
  evidences: []
});

function gerarId() {
  return 'dia_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
}

/* ═══════════════════════════════════════════════════════════
   INICIALIZAÇÃO
   ═══════════════════════════════════════════════════════════ */
window.onload = () => {
  if (!carregarEstado()) {
    aplicarHeader(defaultHeader);
    const d = defaultDia();
    d.descricao = `Acompanhamento técnico das atividades operacionais do britador cônico Metso HP4 no site. Realizada a verificação preventiva das folgas mecânicas, inspeção do sistema de lubrificação e hidráulico de ajuste, bem como o alinhamento com a equipe do cliente durante os ciclos de britagem.\n\nTodas as etapas foram executadas dentro dos padrões de segurança corporativos da Metso.`;
    d.nomeTecnicoDet = "Primo Silva";
    d.cargoTecnico = "Assistente Técnico / Engenheiro Eletricista";
    d.contatoTecnico = "primo.silva@metso.com";
    d.nomeClienteDet = "Antônio Marcuz Neto";
    d.cargoCliente = "Gerente de Manutenção";
    d.contatoCliente = "(15) 99817-9257 | antonio.marcuz@extrabase.com.br";
    dias = [d];
    diaAtivoId = d.id;
  }
  renderTudo();
};

/* ═══════════════════════════════════════════════════════════
   SIDEBAR
   ═══════════════════════════════════════════════════════════ */
function toggleSidebar(open) {
  const sb = document.getElementById('sidebar');
  const ov = document.getElementById('sidebarOverlay');
  if (open) {
    renderSidebar();
    sb.classList.add('open');
    ov.classList.add('open');
  } else {
    sb.classList.remove('open');
    ov.classList.remove('open');
  }
}

function renderSidebar() {
  const list = document.getElementById('sidebarDiasList');
  list.innerHTML = '';

  document.getElementById('sidebarTotalDias').textContent = dias.length;
  const totalHoras = dias.reduce((acc, d) => acc + calcularDuracaoDia(d), 0);
  document.getElementById('sidebarTotalHoras').textContent = totalHoras.toFixed(2).replace('.', ',');

  dias.forEach((d, idx) => {
    const isAtivo = d.id === diaAtivoId;
    const item = document.createElement('div');
    item.className = `dia-item p-3 rounded border border-ink-200 cursor-pointer ${isAtivo ? 'active' : 'bg-white'}`;
    item.innerHTML = `
      <div class="flex items-start justify-between gap-2">
        <div class="flex-grow min-w-0" onclick="selecionarDia('${d.id}')">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="bg-ink-950 text-white text-[10px] font-black px-2 py-0.5">${idx + 1}</span>
            <span class="font-bold text-xs text-ink-900">${formatarData(d.data) || 'Sem data'}</span>
            ${isAtivo ? '<span class="text-[9px] bg-metso-500 text-white px-1.5 py-0.5 font-bold uppercase tracking-wider">ATIVO</span>' : ''}
          </div>
          <div class="text-[10px] text-ink-500 mt-1.5 flex items-center gap-3 uppercase tracking-wide">
            <span><i class="fa-regular fa-clock mr-1"></i>${calcularDuracaoDia(d).toFixed(2).replace('.', ',')}h</span>
            <span><i class="fa-regular fa-image mr-1"></i>${d.evidences.length}</span>
          </div>
          <div class="text-[10px] text-ink-500 mt-1 truncate">${escapar(d.nomeTecnicoDet || '—')}</div>
        </div>
        <div class="flex flex-col gap-0.5 shrink-0">
          <button onclick="event.stopPropagation(); moverDia('${d.id}', -1)" ${idx === 0 ? 'disabled' : ''} class="p-1 text-ink-400 hover:text-ink-900 hover:bg-ink-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Mover para cima">
            <i class="fa-solid fa-chevron-up text-[10px]"></i>
          </button>
          <button onclick="event.stopPropagation(); moverDia('${d.id}', 1)" ${idx === dias.length - 1 ? 'disabled' : ''} class="p-1 text-ink-400 hover:text-ink-900 hover:bg-ink-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Mover para baixo">
            <i class="fa-solid fa-chevron-down text-[10px]"></i>
          </button>
          <button onclick="event.stopPropagation(); excluirDia('${d.id}')" class="p-1 text-ink-400 hover:text-metso-500 hover:bg-metso-50 rounded transition-colors" title="Excluir dia">
            <i class="fa-solid fa-trash-can text-[10px]"></i>
          </button>
        </div>
      </div>`;
    list.appendChild(item);
  });
}

function selecionarDia(diaId) {
  if (diaAtivoId === diaId) return;
  diaAtivoId = diaId;
  renderTudo();
  toggleSidebar(false);
  salvarEstado(false);
}

function irParaDiaEExcluir() {
  if (!diaAtivoId) return;
  excluirDia(diaAtivoId);
}

function moverDia(diaId, dir) {
  const idx = dias.findIndex(d => d.id === diaId);
  if (idx < 0) return;
  const alvo = idx + dir;
  if (alvo < 0 || alvo >= dias.length) return;
  [dias[idx], dias[alvo]] = [dias[alvo], dias[idx]];
  renderTudo();
  salvarEstado(false);
  showToast('Ordem dos dias alterada.', 'info');
}

function excluirDia(diaId) {
  if (dias.length <= 1) {
    showToast('É necessário manter ao menos 1 dia.', 'warning');
    return;
  }
  const d = dias.find(x => x.id === diaId);
  if (!d) return;
  if (!confirm(`Excluir o Diário do dia ${formatarData(d.data)}?\n\nEsta ação não pode ser desfeita.`)) return;

  dias = dias.filter(x => x.id !== diaId);
  delete signatures[diaId];

  if (diaAtivoId === diaId) {
    diaAtivoId = dias[0].id;
  }
  renderTudo();
  salvarEstado(false);
  showToast('Diário excluído.');
}

/* ═══════════════════════════════════════════════════════════
   RENDERIZAÇÃO
   ═══════════════════════════════════════════════════════════ */
function renderTudo() {
  renderPaineis();
  atualizarBadge();
  if (document.getElementById('sidebar').classList.contains('open')) {
    renderSidebar();
  }
}

function atualizarBadge() {
  const b = document.getElementById('badgeTotalDias');
  if (b) b.textContent = `${dias.length} ${dias.length === 1 ? 'dia' : 'dias'}`;
}

function renderPaineis() {
  const cont = document.getElementById('diasContainer');
  cont.innerHTML = '';
  dias.forEach((d, idx) => {
    const panel = document.createElement('div');
    panel.className = `dia-panel ${d.id === diaAtivoId ? 'active' : ''}`;
    panel.dataset.diaId = d.id;
    panel.innerHTML = buildDiaHTML(d, idx);
    cont.appendChild(panel);
  });
  const dAtivo = dias.find(x => x.id === diaAtivoId);
  if (dAtivo) inicializarDia(dAtivo);
}

function buildDiaHTML(d, idx) {
  const totalDia = calcularDuracaoDia(d);
  return `
  <div class="dia-block bg-white rounded-lg shadow-card border border-ink-200 overflow-hidden mb-5">
    
    <!-- Cabeçalho do dia -->
    <div class="card-head bg-ink-950 text-white px-5 py-4 border-b-4 border-metso-500 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
      <div class="flex items-center gap-4">
        <img src="img/metso-logo.png" alt="Metso" class="h-5 w-auto object-contain brightness-0 invert">
        <span class="h-8 w-px bg-white/20"></span>
        <div>
          <div class="text-[10px] text-metso-500 font-bold uppercase tracking-[.2em]">Diário de Visita</div>
          <h2 class="metso-heading text-sm sm:text-base text-white mt-0.5">Dia ${idx + 1}</h2>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <div class="flex items-center gap-2 bg-white/5 px-3 py-1.5 border border-white/10">
          <span class="text-[9px] font-bold text-ink-400 uppercase tracking-widest">Data</span>
          <input type="date" value="${d.data}" onchange="atualizarCampo('${d.id}','data',this.value)" class="font-semibold text-xs bg-transparent text-white outline-none [color-scheme:dark]">
        </div>
        <button onclick="excluirDia('${d.id}')" class="no-print text-[10px] font-bold text-white bg-white/5 hover:bg-metso-500 px-3 py-2 flex items-center gap-1.5 transition-colors border border-white/10" title="Excluir este dia">
          <i class="fa-solid fa-trash-can"></i><span class="uppercase tracking-wider">Excluir</span>
        </button>
      </div>
    </div>

    <div class="p-5 space-y-5">

      <!-- GRADE DE HORAS -->
      <div class="border border-ink-200 overflow-hidden">
        <div class="section-head text-white font-black text-[11px] px-4 py-2.5 uppercase flex items-center gap-2.5">
          <span class="w-1 h-3 bg-metso-500"></span>
          <span>Grade e Apontamento de Horas</span>
        </div>
        <table class="w-full text-xs sm:text-sm border-collapse">
          <thead>
            <tr class="bg-ink-50 text-center border-b border-ink-200 text-ink-600">
              <th class="p-2.5 border-r border-ink-200 text-left text-[10px] uppercase tracking-widest font-bold">Tipo</th>
              <th class="p-2.5 border-r border-ink-200 text-[10px] uppercase tracking-widest font-bold">Início</th>
              <th class="p-2.5 border-r border-ink-200 text-[10px] uppercase tracking-widest font-bold">Final</th>
              <th class="p-2.5 text-[10px] uppercase tracking-widest font-bold">Duração (h)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-ink-150">
            ${linhaHoras(d, 'normais', 'Horas Normais')}
            ${linhaHoras(d, 'extras50', 'Horas Extras 50%')}
            ${linhaHoras(d, 'extras100', 'Horas Extras 100%')}
            <tr class="bg-ink-950 text-white">
              <td colspan="3" class="p-3 text-right uppercase border-r border-ink-800 text-[11px] tracking-widest font-bold">Total do dia</td>
              <td class="p-3 text-center font-black text-lg text-metso-100" data-total="${d.id}">${totalDia.toFixed(2).replace('.', ',')}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- DESCRIÇÃO -->
      <div class="border border-ink-200 overflow-hidden">
        <div class="section-head text-white font-black text-[11px] px-4 py-2.5 uppercase flex items-center justify-between">
          <span class="flex items-center gap-2.5">
            <span class="w-1 h-3 bg-metso-500"></span>
            <span>Descrição dos Serviços e Acontecimentos</span>
          </span>
          <span class="no-print text-[9px] font-medium text-ink-400 normal-case tracking-normal" data-counter="${d.id}">${(d.descricao || '').length} caracteres</span>
        </div>
        <div class="p-3 bg-white">
          <textarea data-descricao="${d.id}" rows="5" class="descricao-textarea w-full p-3 text-xs sm:text-sm text-justify leading-relaxed border border-ink-200 outline-none focus:border-ink-900 resize-none overflow-hidden print:hidden transition-all placeholder:text-ink-400" placeholder="Descreva as atividades deste dia...">${escapar(d.descricao)}</textarea>
          <div class="print-only-text p-1" data-print-descricao="${d.id}">${escapar(d.descricao)}</div>
        </div>
      </div>

      <!-- EVIDÊNCIAS -->
      <div class="border border-ink-200 overflow-hidden page-break-before">
        <div class="section-head text-white font-black text-[11px] px-4 py-2.5 uppercase flex items-center justify-between">
          <span class="flex items-center gap-2.5">
            <span class="w-1 h-3 bg-metso-500"></span>
            <span>Evidências — Dia ${idx + 1}</span>
          </span>
          <label class="no-print btn-metso-red cursor-pointer flex items-center gap-1.5 rounded-sm">
            <i class="fa-solid fa-plus"></i> Adicionar
            <input type="file" multiple onchange="handleFileSelect(event, '${d.id}')" class="hidden">
          </label>
        </div>
        <div class="p-4 bg-white min-h-[100px]">
          <div data-empty="${d.id}" class="${d.evidences.length ? 'hidden' : ''} flex flex-col items-center justify-center py-8 text-ink-400 text-center border-2 border-dashed border-ink-200">
            <i class="fa-solid fa-cloud-arrow-up text-4xl mb-2 text-ink-300"></i>
            <p class="text-[11px] font-medium">Nenhuma evidência neste dia.</p>
            <p class="text-[10px] text-ink-400 mt-1">Clique em "Adicionar" para enviar fotos, vídeos ou PDFs.</p>
          </div>
          <div data-gallery="${d.id}" class="gallery-grid ${d.evidences.length ? 'grid' : 'hidden'} grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2"></div>
        </div>
      </div>

      <!-- ASSINATURAS UNIFICADAS -->
      <div class="border border-ink-200 overflow-hidden assinaturas-unificadas">
        <div class="section-head text-white font-black text-[11px] px-4 py-2.5 uppercase flex items-center gap-2.5">
          <span class="w-1 h-3 bg-metso-500"></span>
          <span>Assinaturas — Dia ${idx + 1}</span>
        </div>
        
        <div class="relative p-4 bg-white grid grid-cols-1 sm:grid-cols-2 gap-6">
          <!-- Linha divisória central sutil -->
          <div class="hidden sm:block absolute inset-y-4 left-1/2 w-px bg-ink-200" style="transform: translateX(-50%);"></div>
          
          ${buildAssinaturaHTML(d, 'Tecnico', 'Técnico Responsável (Metso)')}
          ${buildAssinaturaHTML(d, 'Cliente', 'Cliente / Acompanhante')}
        </div>
      </div>

    </div>

    <!-- NOVO: Rodapé Fixo que aparece no PDF em todas as páginas -->
    <div class="print-footer">
      <div class="flex items-center gap-2">
        <img src="img/metso-logo.png" alt="Metso" class="h-3 w-auto brightness-0 invert">
        <span class="text-white/40 mx-1">|</span>
        <span class="text-ink-400 uppercase tracking-widest text-[8px]">Field Service</span>
      </div>
      <div class="text-right leading-tight text-ink-300">
        <div>Av. Independência, 2500 — Iporanga, Sorocaba — SP, 18087-101</div>
        <div class="font-bold">Metso 2025/2026 © Todos os Direitos Reservados</div>
      </div>
    </div>

  </div>`;
}

function linhaHoras(d, prefix, label) {
  const inicio = d[prefix + 'Inicio'] || '';
  const fim = d[prefix + 'Final'] || '';
  const dur = calcularDuracao(inicio, fim);
  return `
    <tr class="hover:bg-ink-50 transition-colors">
      <td class="bg-ink-50 font-bold p-2.5 uppercase border-r border-ink-200 text-[10px] tracking-widest text-ink-700">${label}</td>
      <td class="p-1 border-r border-ink-200"><input type="text" value="${inicio}" oninput="atualizarCampo('${d.id}','${prefix}Inicio',this.value); recalc('${d.id}')" class="w-full text-center outline-none focus:bg-ink-100 px-2 py-1.5 font-medium transition-colors" placeholder="00:00"></td>
      <td class="p-1 border-r border-ink-200"><input type="text" value="${fim}" oninput="atualizarCampo('${d.id}','${prefix}Final',this.value); recalc('${d.id}')" class="w-full text-center outline-none focus:bg-ink-100 px-2 py-1.5 font-medium transition-colors" placeholder="00:00"></td>
      <td class="p-2.5 text-center font-bold text-ink-900" data-dur="${d.id}_${prefix}">${dur ? dur.toFixed(2).replace('.', ',') : ''}</td>
    </tr>`;
}

function buildAssinaturaHTML(d, tipo, label) {
  const sig = (signatures[d.id] && signatures[d.id][tipo]) || null;
  return `
    <div class="border border-ink-200 bg-ink-25 p-3 flex flex-col gap-2.5">
      <div class="signature-wrap relative border border-ink-200 bg-white flex items-center justify-center overflow-hidden">
        <canvas id="canvas_${d.id}_${tipo}" class="signature-canvas touch-none cursor-crosshair w-full h-[180px]"></canvas>
        <img id="img_${d.id}_${tipo}" src="${sig || ''}" class="signature-img-print max-h-[160px] w-auto object-contain ${sig ? '' : 'hidden'}" alt="Assinatura ${tipo}">
        <span class="no-print absolute top-2 left-3 text-[9px] uppercase font-bold tracking-widest text-ink-400 pointer-events-none select-none ${sig ? 'hidden' : ''}" id="hint_${d.id}_${tipo}">
          <i class="fa-solid fa-pen mr-1"></i>Assine aqui
        </span>
        <button type="button" onclick="clearSignature('${d.id}','${tipo}')" class="no-print absolute top-2 right-2 bg-white hover:bg-metso-50 hover:text-metso-500 text-ink-500 p-1.5 text-[9px] font-bold border border-ink-200 shadow-sm transition-colors" title="Limpar assinatura">
          <i class="fa-solid fa-eraser"></i>
        </button>
      </div>
      <div class="border-t-2 border-ink-900 text-center text-[10px] font-black uppercase pt-2 tracking-widest text-ink-900">${label}</div>
      <div class="space-y-1.5 text-[11px]">
        <div class="flex items-center gap-2"><span class="font-bold text-ink-500 w-16 shrink-0 uppercase text-[9px] tracking-widest">Nome</span><input type="text" value="${escapar(d['nome' + tipo + 'Det'])}" onchange="atualizarCampo('${d.id}','nome${tipo}Det',this.value)" class="w-full outline-none px-2 py-1 border-b border-ink-200 focus:border-ink-900 font-medium bg-transparent transition-colors"></div>
        <div class="flex items-center gap-2"><span class="font-bold text-ink-500 w-16 shrink-0 uppercase text-[9px] tracking-widest">Cargo</span><input type="text" value="${escapar(d['cargo' + tipo])}" onchange="atualizarCampo('${d.id}','cargo${tipo}',this.value)" class="w-full outline-none px-2 py-1 border-b border-ink-200 focus:border-ink-900 bg-transparent transition-colors"></div>
        <div class="flex items-center gap-2"><span class="font-bold text-ink-500 w-16 shrink-0 uppercase text-[9px] tracking-widest">Contato</span><input type="text" value="${escapar(d['contato' + tipo])}" onchange="atualizarCampo('${d.id}','contato${tipo}',this.value)" class="w-full outline-none px-2 py-1 border-b border-ink-200 focus:border-ink-900 bg-transparent transition-colors"></div>
      </div>
    </div>`;
}

/* ═══════════════════════════════════════════════════════════
   INICIALIZAÇÃO DO DIA
   ═══════════════════════════════════════════════════════════ */
function inicializarDia(d) {
  ['Tecnico', 'Cliente'].forEach(tipo => initCanvas(d.id, tipo));

  const ta = document.querySelector(`[data-descricao="${d.id}"]`);
  if (ta) {
    autoResize(ta);
    ta.addEventListener('input', () => {
      autoResize(ta);
      const print = document.querySelector(`[data-print-descricao="${d.id}"]`);
      if (print) print.textContent = ta.value;
      const counter = document.querySelector(`[data-counter="${d.id}"]`);
      if (counter) counter.textContent = ta.value.length + ' caracteres';
      atualizarCampo(d.id, 'descricao', ta.value);
    });
  }
  renderGalleryForDia(d.id);
}

function autoResize(ta) {
  ta.style.height = 'auto';
  ta.style.height = ta.scrollHeight + 'px';
}

/* ═══════════════════════════════════════════════════════════
   ASSINATURAS
   ═══════════════════════════════════════════════════════════ */
function initCanvas(diaId, tipo) {
  const canvas = document.getElementById(`canvas_${diaId}_${tipo}`);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let desenhando = false;
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  ctx.strokeStyle = '#14171c';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const sigSalva = signatures[diaId] && signatures[diaId][tipo];
  if (sigSalva) {
    const img = new Image();
    img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
    img.src = sigSalva;
  }

  const hint = document.getElementById(`hint_${diaId}_${tipo}`);
  const esconderHint = () => { if (hint) hint.classList.add('hidden'); };

  const getPos = (e) => {
    const r = canvas.getBoundingClientRect();
    let cx = e.clientX, cy = e.clientY;
    if (e.touches && e.touches[0]) { cx = e.touches[0].clientX; cy = e.touches[0].clientY; }
    return { x: cx - r.left, y: cy - r.top };
  };

  const start = (e) => { desenhando = true; esconderHint(); const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
  const move  = (e) => { if (!desenhando) return; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
  const stop  = () => {
    if (!desenhando) return;
    desenhando = false;
    if (!signatures[diaId]) signatures[diaId] = {};
    signatures[diaId][tipo] = canvas.toDataURL('image/png');
    const img = document.getElementById(`img_${diaId}_${tipo}`);
    if (img) { img.src = signatures[diaId][tipo]; img.classList.remove('hidden'); }
    salvarEstado(false);
  };

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  canvas.addEventListener('mouseup', stop);
  canvas.addEventListener('mouseleave', stop);
  canvas.addEventListener('touchstart', (e) => { e.preventDefault(); start(e); }, { passive: false });
  canvas.addEventListener('touchmove',  (e) => { e.preventDefault(); move(e); },  { passive: false });
  canvas.addEventListener('touchend', stop);
}

function clearSignature(diaId, tipo) {
  const canvas = document.getElementById(`canvas_${diaId}_${tipo}`);
  if (canvas) canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  if (signatures[diaId]) signatures[diaId][tipo] = null;
  const img = document.getElementById(`img_${diaId}_${tipo}`);
  if (img) { img.src = ''; img.classList.add('hidden'); }
  const hint = document.getElementById(`hint_${diaId}_${tipo}`);
  if (hint) hint.classList.remove('hidden');
  salvarEstado(false);
  showToast('Assinatura removida.', 'info');
}

/* ═══════════════════════════════════════════════════════════
   CÁLCULOS
   ═══════════════════════════════════════════════════════════ */
function parseHoras(str) {
  if (!str) return 0;
  const p = str.replace(',', '.').split(':');
  if (p.length === 2) return parseFloat(p[0]) + parseFloat(p[1]) / 60;
  return parseFloat(str) || 0;
}

function calcularDuracao(inicio, fim) {
  const i = parseHoras(inicio), f = parseHoras(fim);
  return f >= i ? f - i : 0;
}

function calcularDuracaoDia(d) {
  return calcularDuracao(d.normaisInicio, d.normaisFinal)
       + calcularDuracao(d.extras50Inicio, d.extras50Final)
       + calcularDuracao(d.extras100Inicio, d.extras100Final);
}

function recalc(diaId) {
  const d = dias.find(x => x.id === diaId);
  if (!d) return;
  ['normais', 'extras50', 'extras100'].forEach(p => {
    const dur = calcularDuracao(d[p + 'Inicio'], d[p + 'Final']);
    const el = document.querySelector(`[data-dur="${diaId}_${p}"]`);
    if (el) el.textContent = dur ? dur.toFixed(2).replace('.', ',') : '';
  });
  const total = calcularDuracaoDia(d);
  const totalEl = document.querySelector(`[data-total="${diaId}"]`);
  if (totalEl) totalEl.textContent = total.toFixed(2).replace('.', ',');
  salvarEstado(false);
}

function atualizarCampo(diaId, campo, valor) {
  const d = dias.find(x => x.id === diaId);
  if (!d) return;
  d[campo] = valor;
  salvarEstado(false);
}

/* ═══════════════════════════════════════════════════════════
   GERENCIAMENTO DE DIAS
   ═══════════════════════════════════════════════════════════ */
function addDia(abrirSidebar = false) {
  const novo = defaultDia();
  const ultimo = dias[dias.length - 1];
  if (ultimo && ultimo.data) {
    const dt = new Date(ultimo.data + 'T12:00:00');
    dt.setDate(dt.getDate() + 1);
    novo.data = dt.toISOString().split('T')[0];
  }
  if (ultimo) {
    novo.nomeTecnicoDet = ultimo.nomeTecnicoDet;
    novo.cargoTecnico = ultimo.cargoTecnico;
    novo.contatoTecnico = ultimo.contatoTecnico;
    novo.normaisInicio = ultimo.normaisInicio;
    novo.normaisFinal = ultimo.normaisFinal;
  }
  dias.push(novo);
  diaAtivoId = novo.id;
  renderTudo();
  salvarEstado(false);
  if (abrirSidebar) renderSidebar();
  showToast(`Dia ${dias.length} adicionado.`);
}

/* ═══════════════════════════════════════════════════════════
   EVIDÊNCIAS
   ═══════════════════════════════════════════════════════════ */
function handleFileSelect(event, diaId) {
  const files = event.target.files;
  if (!files.length) return;
  const d = dias.find(x => x.id === diaId);
  if (!d) return;
  Array.from(files).forEach(file => {
    const reader = new FileReader();
    reader.onload = (e) => {
      d.evidences.push({
        id: 'ev_' + Date.now() + Math.random().toString(36).substr(2, 6),
        name: file.name, size: file.size,
        type: file.type || 'application/octet-stream',
        src: e.target.result
      });
      renderGalleryForDia(diaId);
      salvarEstado(false);
    };
    reader.readAsDataURL(file);
  });
  showToast('Evidência(s) adicionada(s).');
}

function renderGalleryForDia(diaId) {
  const d = dias.find(x => x.id === diaId);
  if (!d) return;
  const gallery = document.querySelector(`[data-gallery="${diaId}"]`);
  const empty = document.querySelector(`[data-empty="${diaId}"]`);
  if (!gallery || !empty) return;

  if (d.evidences.length === 0) {
    gallery.innerHTML = '';
    gallery.classList.add('hidden');
    gallery.classList.remove('grid');
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');
  gallery.classList.remove('hidden');
  gallery.classList.add('grid');
  gallery.innerHTML = '';

  d.evidences.forEach(item => {
    const meta = getFileIcon(item.type, item.name);
    const card = document.createElement('div');
    card.className = 'group relative bg-white border border-ink-200 overflow-hidden shadow-sm hover:shadow-cardHover transition-all flex flex-col';
    let preview = '';
    if (meta.isImage) {
      preview = `<div class="aspect-video cursor-pointer bg-ink-100 overflow-hidden" onclick="openMedia('${diaId}','${item.id}')"><img src="${item.src}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"></div>`;
    } else if (meta.isVideo) {
      preview = `<div class="aspect-video flex flex-col items-center justify-center bg-ink-950 text-white cursor-pointer" onclick="openMedia('${diaId}','${item.id}')"><i class="fa-solid fa-circle-play text-white text-3xl"></i><span class="text-[9px] mt-1 font-semibold uppercase tracking-widest">Vídeo</span></div>`;
    } else {
      preview = `<div class="aspect-video flex flex-col items-center justify-center bg-ink-50 p-1 cursor-pointer" onclick="openMedia('${diaId}','${item.id}')"><i class="fa-solid ${meta.icon} ${meta.color} text-3xl"></i><span class="text-[9px] uppercase font-semibold mt-1 text-ink-500">${item.name.split('.').pop()}</span></div>`;
    }
    card.innerHTML = `
      ${preview}
      <div class="p-2 text-[10px] bg-white border-t border-ink-200">
        <p class="truncate font-semibold text-ink-800" title="${item.name}">${item.name}</p>
        <p class="text-ink-400 text-[9px]">${formatFileSize(item.size)}</p>
        <div class="flex justify-end gap-0.5 mt-1.5 border-t border-ink-100 pt-1.5">
          <button onclick="openMedia('${diaId}','${item.id}')" class="no-print p-1.5 hover:text-ink-900 hover:bg-ink-100 rounded transition-colors" title="Visualizar"><i class="fa-solid fa-expand"></i></button>
          <button onclick="downloadFile('${diaId}','${item.id}')" class="no-print p-1.5 hover:text-ink-900 hover:bg-ink-100 rounded transition-colors" title="Baixar"><i class="fa-solid fa-download"></i></button>
          <button onclick="removeEvidence('${diaId}','${item.id}')" class="no-print p-1.5 hover:text-metso-500 hover:bg-metso-50 rounded transition-colors" title="Remover"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </div>`;
    gallery.appendChild(card);
  });
}

function removeEvidence(diaId, evId) {
  const d = dias.find(x => x.id === diaId);
  if (!d) return;
  d.evidences = d.evidences.filter(e => e.id !== evId);
  renderGalleryForDia(diaId);
  salvarEstado(false);
  showToast('Evidência removida.');
}

function downloadFile(diaId, evId) {
  const d = dias.find(x => x.id === diaId);
  const ev = d && d.evidences.find(e => e.id === evId);
  if (!ev) return;
  const a = document.createElement('a');
  a.href = ev.src; a.download = ev.name;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}

function openMedia(diaId, evId) {
  const d = dias.find(x => x.id === diaId);
  const ev = d && d.evidences.find(e => e.id === evId);
  if (!ev) return;
  const meta = getFileIcon(ev.type, ev.name);
  const cont = document.getElementById('modalContentContainer');
  const cap = document.getElementById('modalCaption');
  const modal = document.getElementById('imageModal');
  cont.innerHTML = '';
  cap.textContent = ev.name;

  if (meta.isImage) {
    const img = document.createElement('img');
    img.src = ev.src; img.className = 'max-h-[75vh] w-auto max-w-full object-contain rounded shadow-2xl';
    cont.appendChild(img);
  } else if (meta.isVideo) {
    const v = document.createElement('video');
    v.src = ev.src; v.controls = true; v.autoplay = true;
    v.className = 'max-h-[75vh] w-full max-w-3xl rounded shadow-2xl bg-black';
    cont.appendChild(v);
  } else if (meta.isPdf) {
    const iframe = document.createElement('iframe');
    iframe.src = ev.src; iframe.className = 'w-full h-[75vh] max-w-4xl rounded shadow-2xl bg-white';
    cont.appendChild(iframe);
  } else {
    showToast('Pré-visualização indisponível.', 'warning');
    downloadFile(diaId, evId);
    return;
  }
  modal.classList.remove('hidden');
}

function closeModal() {
  const cont = document.getElementById('modalContentContainer');
  const v = cont && cont.querySelector('video');
  if (v) v.pause();
  if (cont) cont.innerHTML = '';
  document.getElementById('imageModal').classList.add('hidden');
}

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */
function formatFileSize(bytes) {
  if (!bytes) return '0 B';
  const k = 1024, sizes = ['B','KB','MB','GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFileIcon(type, name) {
  const ext = name.split('.').pop().toLowerCase();
  if (type.startsWith('image/')) return { icon: 'fa-image', color: 'text-ink-600', isImage: true, isVideo: false, isPdf: false };
  if (type.startsWith('video/')) return { icon: 'fa-file-video', color: 'text-ink-600', isImage: false, isVideo: true, isPdf: false };
  if (type.includes('pdf') || ext === 'pdf') return { icon: 'fa-file-pdf', color: 'text-metso-500', isImage: false, isVideo: false, isPdf: true };
  if (['doc','docx'].includes(ext)) return { icon: 'fa-file-word', color: 'text-ink-600', isImage:false, isVideo:false, isPdf:false };
  if (['xls','xlsx','csv'].includes(ext)) return { icon: 'fa-file-excel', color: 'text-ink-600', isImage:false, isVideo:false, isPdf:false };
  if (['zip','rar','7z'].includes(ext)) return { icon: 'fa-file-zipper', color: 'text-ink-600', isImage:false, isVideo:false, isPdf:false };
  return { icon: 'fa-file', color: 'text-ink-400', isImage:false, isVideo:false, isPdf:false };
}

function getValorHeader(id) {
  const el = document.getElementById(id);
  return el ? el.value : '';
}
function aplicarHeader(h) {
  ['inputWO', 'inputCliente', 'inputEquipamento', 'inputNoSerie', 'inputTecnico'].forEach(id => {
    const key = id.replace('input', '').toLowerCase();
    const el = document.getElementById(id);
    if (el && h[key] !== undefined) el.value = h[key];
  });
}

document.addEventListener('DOMContentLoaded', () => {
  ['inputWO','inputCliente','inputEquipamento','inputNoSerie','inputTecnico'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', () => salvarEstado(false));
  });
});

/* ═══════════════════════════════════════════════════════════
   PERSISTÊNCIA LOCAL
   ═══════════════════════════════════════════════════════════ */
function coletarEstado() {
  return {
    versao: 3,
    header: {
      wo: getValorHeader('inputWO'),
      cliente: getValorHeader('inputCliente'),
      equipamento: getValorHeader('inputEquipamento'),
      noSerie: getValorHeader('inputNoSerie'),
      tecnico: getValorHeader('inputTecnico')
    },
    dias, signatures, diaAtivoId,
    exportedAt: new Date().toISOString()
  };
}

function salvarEstado(notificar = false) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(coletarEstado()));
    if (notificar) showToast('Rascunho salvo localmente!');
  } catch (e) {
    if (notificar) showToast('Erro ao salvar.', 'warning');
  }
}

function carregarEstado() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return false;
  try {
    const s = JSON.parse(raw);
    if (s.header) aplicarHeader(s.header);
    if (Array.isArray(s.dias) && s.dias.length) {
      dias = s.dias.map(d => ({ ...defaultDia(), ...d }));
      signatures = s.signatures || {};
      diaAtivoId = s.diaAtivoId && dias.find(x => x.id === s.diaAtivoId) ? s.diaAtivoId : dias[0].id;
      return true;
    }
  } catch (e) { console.warn(e); }
  return false;
}

/* ═══════════════════════════════════════════════════════════
   EXPORT JSON — File System Access API
   ═══════════════════════════════════════════════════════════ */
async function exportJSONState() {
  const s = coletarEstado();
  const json = JSON.stringify(s, null, 2);
  const wo = (s.header.wo || 'WO').replace(/\s+/g, '_');
  const nomeArquivo = `Diarios_Visita_Metso_${wo}_${s.dias.length}dias.json`;

  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: nomeArquivo,
        types: [{
          description: 'Arquivo JSON',
          accept: { 'application/json': ['.json'] }
        }]
      });
      const writable = await handle.createWritable();
      await writable.write(json);
      await writable.close();
      showToast(`Backup salvo: ${handle.name}`);
      return;
    } catch (err) {
      if (err.name === 'AbortError') {
        showToast('Salvamento cancelado.', 'info');
        return;
      }
      console.warn('File System Access falhou, usando fallback:', err);
    }
  }

  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast(`Exportado (via download): ${s.dias.length} diário(s).`);
}

/* ═══════════════════════════════════════════════════════════
   IMPORT JSON
   ═══════════════════════════════════════════════════════════ */
function importJSONState(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const s = JSON.parse(e.target.result);
      if (s.header) aplicarHeader(s.header);
      if (Array.isArray(s.dias) && s.dias.length) {
        dias = s.dias.map(d => ({ ...defaultDia(), ...d }));
        signatures = s.signatures || {};
        diaAtivoId = dias[0].id;
        renderTudo();
        salvarEstado(false);
        showToast(`${dias.length} diário(s) importado(s).`);
      } else {
        showToast('JSON sem dias válidos.', 'error');
      }
    } catch (err) {
      showToast('Arquivo JSON inválido.', 'error');
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}

/* ═══════════════════════════════════════════════════════════
   RESET / CLEAR
   ═══════════════════════════════════════════════════════════ */
function loadTemplateData() {
  if (!confirm('Substituir todos os diários pelo modelo padrão?')) return;
  aplicarHeader(defaultHeader);
  const d = defaultDia();
  d.descricao = `Acompanhamento técnico das atividades operacionais do britador cônico Metso HP4 no site. Realizada a verificação preventiva das folgas mecânicas, inspeção do sistema de lubrificação e hidráulico de ajuste, bem como o alinhamento com a equipe do cliente durante os ciclos de britagem.\n\nTodas as etapas foram executadas dentro dos padrões de segurança corporativos da Metso.`;
  d.nomeTecnicoDet = "Primo Silva";
  d.cargoTecnico = "Assistente Técnico / Engenheiro Eletricista";
  d.contatoTecnico = "primo.silva@metso.com";
  d.nomeClienteDet = "Antônio Marcuz Neto";
  d.cargoCliente = "Gerente de Manutenção";
  d.contatoCliente = "(15) 99817-9257 | antonio.marcuz@extrabase.com.br";
  dias = [d];
  signatures = {};
  diaAtivoId = d.id;
  renderTudo();
  salvarEstado(false);
  showToast('Modelo padrão Metso carregado.', 'info');
}

function clearAll() {
  if (!confirm('Limpar TODOS os diários e voltar a 1 dia em branco?')) return;
  ['inputWO','inputCliente','inputEquipamento','inputNoSerie','inputTecnico'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const d = defaultDia();
  d.normaisInicio = ''; d.normaisFinal = '';
  d.extras50Inicio = ''; d.extras50Final = '';
  dias = [d];
  signatures = {};
  diaAtivoId = d.id;
  renderTudo();
  salvarEstado(false);
  showToast('Tudo limpo.', 'warning');
}

/* ═══════════════════════════════════════════════════════════
   IMPRESSÃO
   ═══════════════════════════════════════════════════════════ */
function printAll() {
  document.querySelectorAll('.dia-panel').forEach(p => p.classList.add('active'));
  window.print();
  setTimeout(() => {
    document.querySelectorAll('.dia-panel').forEach(p => {
      p.classList.toggle('active', p.dataset.diaId === diaAtivoId);
    });
  }, 500);
}

/* ═══════════════════════════════════════════════════════════
   HELPERS FINAIS
   ═══════════════════════════════════════════════════════════ */
function escapar(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatarData(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  const m = document.getElementById('toastMessage');
  const i = document.getElementById('toastIcon');
  m.textContent = msg;
  const map = {
    success: 'fa-circle-check text-white',
    error:   'fa-circle-exclamation text-metso-500',
    warning: 'fa-triangle-exclamation text-white',
    info:    'fa-circle-info text-ink-400'
  };
  i.className = 'fa-solid ' + (map[type] || map.success);
  t.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => t.classList.add('translate-y-20', 'opacity-0'), 3000);
}