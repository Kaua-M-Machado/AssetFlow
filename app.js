/* ==============================
   ASSETFLOW — APP.JS
   ============================== */

const API_BASE = 'http://localhost:3000/api';

// State
let ativos = [];
let filteredAtivos = [];
let sortConfig = { key: 'id', dir: 'asc' };
let pendingDeleteId = null;

// DOM refs
const form = document.getElementById('formAtivo');
const btnSubmit = document.getElementById('btnSubmit');
const btnText = btnSubmit.querySelector('.btn-text');
const btnLoading = btnSubmit.querySelector('.btn-loading');
const formFeedback = document.getElementById('formFeedback');
const tbodyAtivos = document.getElementById('tbodyAtivos');
const searchInput = document.getElementById('searchInput');
const filterSetor = document.getElementById('filterSetor');
const tableSubtitle = document.getElementById('tableSubtitle');
const footerCount = document.getElementById('footerCount');
const modalOverlay = document.getElementById('modalOverlay');
const modalDesc = document.getElementById('modalDesc');
const btnModalCancel = document.getElementById('btnModalCancel');
const btnModalConfirm = document.getElementById('btnModalConfirm');
const statusDot = document.getElementById('statusDot');

// Stat DOM refs
const statTotal = document.getElementById('totalAtivos');
const statTipos = document.getElementById('totalTipos');
const statSetores = document.getElementById('totalSetores');
const statColaboradores = document.getElementById('totalColaboradores');

// ===== TYPE ICONS =====
const tipoEmojis = {
  'Computador': '🖥️', 'Notebook': '💻', 'Monitor': '🖵',
  'Teclado': '⌨️', 'Mouse': '🖱️', 'Impressora': '🖨️',
  'Telefone': '📞', 'Roteador': '📡', 'Switch': '🔌', 'Outro': '📦'
};

// ===== FETCH ATIVOS =====
async function fetchAtivos() {
  try {
    const res = await fetch(`${API_BASE}/ativos`);
    if (!res.ok) throw new Error('Network error');
    ativos = await res.json();
    setOnline(true);
    applyFiltersAndSort();
    updateStats();
  } catch (err) {
    setOnline(false);
    console.error('Erro ao carregar ativos:', err);
    showEmptyState('Não foi possível conectar ao servidor. Certifique-se de que o servidor está rodando na porta 3000.');
  }
}

function setOnline(online) {
  statusDot.classList.toggle('offline', !online);
  statusDot.title = online ? 'Conectado ao servidor' : 'Sem conexão com o servidor';
}

// ===== UPDATE STATS =====
function updateStats() {
  statTotal.textContent = ativos.length;
  statTipos.textContent = new Set(ativos.map(a => a.tipo)).size;
  statSetores.textContent = new Set(ativos.map(a => a.setor)).size;
  statColaboradores.textContent = new Set(ativos.map(a => a.colaborador.toLowerCase())).size;
}

// ===== FILTER + SORT =====
function applyFiltersAndSort() {
  const query = searchInput.value.trim().toLowerCase();
  const setor = filterSetor.value;

  filteredAtivos = ativos.filter(a => {
    const matchSetor = setor ? a.setor === setor : true;
    const matchQuery = !query || [a.tipo, a.modelo, a.colaborador, a.setor, String(a.id)]
      .some(v => v.toLowerCase().includes(query));
    return matchSetor && matchQuery;
  });

  // Sort
  filteredAtivos.sort((a, b) => {
    let va = a[sortConfig.key], vb = b[sortConfig.key];
    if (typeof va === 'string') va = va.toLowerCase();
    if (typeof vb === 'string') vb = vb.toLowerCase();
    if (va < vb) return sortConfig.dir === 'asc' ? -1 : 1;
    if (va > vb) return sortConfig.dir === 'asc' ? 1 : -1;
    return 0;
  });

  renderTable();
}

// ===== RENDER TABLE =====
function renderTable(newId = null) {
  tbodyAtivos.innerHTML = '';

  if (filteredAtivos.length === 0) {
    showEmptyState(
      ativos.length === 0
        ? 'Nenhum ativo cadastrado ainda.'
        : 'Nenhum resultado encontrado para os filtros aplicados.'
    );
    tableSubtitle.textContent = 'Inventário vazio';
    footerCount.textContent = '';
    return;
  }

  tableSubtitle.textContent = `${filteredAtivos.length} ativo${filteredAtivos.length !== 1 ? 's' : ''} encontrado${filteredAtivos.length !== 1 ? 's' : ''}`;
  footerCount.textContent = `Exibindo ${filteredAtivos.length} de ${ativos.length} ativo${ativos.length !== 1 ? 's' : ''}`;

  filteredAtivos.forEach(ativo => {
    const tr = document.createElement('tr');
    if (ativo.id === newId) tr.classList.add('row-new');

    const badgeClass = `badge-${ativo.tipo.toLowerCase()}`;
    const emoji = tipoEmojis[ativo.tipo] || '📦';
    const dateStr = ativo.dataCadastro
      ? new Date(ativo.dataCadastro).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
      : '—';

    tr.innerHTML = `
      <td><span class="cell-id">#${String(ativo.id).padStart(3, '0')}</span></td>
      <td><span class="tipo-badge ${badgeClass}">${emoji} ${ativo.tipo}</span></td>
      <td style="color:var(--text-primary);font-weight:500">${escHtml(ativo.modelo)}</td>
      <td><span class="cell-colaborador">${escHtml(ativo.colaborador)}</span></td>
      <td><span class="setor-badge">${escHtml(ativo.setor)}</span></td>
      <td><span class="cell-date">${dateStr}</span></td>
      <td>
        <button class="btn-delete" data-id="${ativo.id}" title="Remover ativo">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
      </td>
    `;

    tbodyAtivos.appendChild(tr);
  });

  // Attach delete listeners
  tbodyAtivos.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => openDeleteModal(parseInt(btn.dataset.id)));
  });
}

function showEmptyState(message) {
  tbodyAtivos.innerHTML = `
    <tr class="row-empty">
      <td colspan="7">
        <div class="empty-state">
          <svg viewBox="0 0 64 64" fill="none">
            <rect x="8" y="16" width="48" height="36" rx="4" stroke="currentColor" stroke-width="2"/>
            <path d="M8 24h48" stroke="currentColor" stroke-width="2"/>
            <rect x="16" y="32" width="12" height="4" rx="2" fill="currentColor" opacity="0.3"/>
            <rect x="16" y="40" width="20" height="4" rx="2" fill="currentColor" opacity="0.2"/>
            <rect x="36" y="32" width="16" height="4" rx="2" fill="currentColor" opacity="0.2"/>
          </svg>
          <p>${escHtml(message)}</p>
        </div>
      </td>
    </tr>
  `;
}

// ===== FORM VALIDATION =====
function validateForm() {
  const fields = ['tipo', 'modelo', 'colaborador', 'setor'];
  let valid = true;

  fields.forEach(name => {
    const el = document.getElementById(name);
    const err = document.getElementById(`err-${name}`);
    const val = el.value.trim();

    if (!val) {
      el.classList.add('invalid');
      err.textContent = 'Este campo é obrigatório.';
      valid = false;
    } else {
      el.classList.remove('invalid');
      err.textContent = '';
    }
  });

  // Extra validation: colaborador should have at least 2 words
  const colaborador = document.getElementById('colaborador');
  const errColab = document.getElementById('err-colaborador');
  if (colaborador.value.trim() && colaborador.value.trim().split(/\s+/).length < 2) {
    colaborador.classList.add('invalid');
    errColab.textContent = 'Informe o nome completo (nome e sobrenome).';
    valid = false;
  }

  return valid;
}

// ===== FORM SUBMIT =====
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!validateForm()) return;

  const payload = {
    tipo: document.getElementById('tipo').value,
    modelo: document.getElementById('modelo').value.trim(),
    colaborador: document.getElementById('colaborador').value.trim(),
    setor: document.getElementById('setor').value,
  };

  // Loading state
  btnText.classList.add('hidden');
  btnLoading.classList.remove('hidden');
  btnSubmit.disabled = true;
  formFeedback.classList.add('hidden');
  formFeedback.className = 'form-feedback hidden';

  try {
    const res = await fetch(`${API_BASE}/ativos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error('Server error');
    const saved = await res.json();

    // Add to local state
    ativos.push(saved);
    applyFiltersAndSort();
    updateStats();

    // Reset form
    form.reset();
    ['tipo', 'modelo', 'colaborador', 'setor'].forEach(f => {
      document.getElementById(f).classList.remove('invalid');
      document.getElementById(`err-${f}`).textContent = '';
    });

    // Success feedback
    showFeedback('success', `✓ Ativo #${String(saved.id).padStart(3,'0')} cadastrado com sucesso!`);

    // Scroll to new row
    setTimeout(() => {
      const newRow = tbodyAtivos.querySelector('.row-new');
      if (newRow) newRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);

    setOnline(true);
  } catch (err) {
    showFeedback('error', '✗ Erro ao salvar. Verifique se o servidor está ativo.');
    setOnline(false);
  } finally {
    btnText.classList.remove('hidden');
    btnLoading.classList.add('hidden');
    btnSubmit.disabled = false;
  }
});

function showFeedback(type, msg) {
  formFeedback.textContent = msg;
  formFeedback.className = `form-feedback ${type}`;
  setTimeout(() => {
    formFeedback.className = 'form-feedback hidden';
  }, 4000);
}

// Clear errors on change
['tipo', 'modelo', 'colaborador', 'setor'].forEach(name => {
  document.getElementById(name).addEventListener('input', () => {
    document.getElementById(name).classList.remove('invalid');
    document.getElementById(`err-${name}`).textContent = '';
  });
});

// ===== SORTING =====
document.querySelectorAll('th[data-sort]').forEach(th => {
  th.addEventListener('click', () => {
    const key = th.dataset.sort;
    if (sortConfig.key === key) {
      sortConfig.dir = sortConfig.dir === 'asc' ? 'desc' : 'asc';
    } else {
      sortConfig.key = key;
      sortConfig.dir = 'asc';
    }

    // Update UI
    document.querySelectorAll('th[data-sort]').forEach(t => t.classList.remove('active'));
    th.classList.add('active');
    const icon = th.querySelector('.sort-icon');
    icon.textContent = sortConfig.dir === 'asc' ? '↑' : '↓';

    applyFiltersAndSort();
  });
});

// ===== SEARCH + FILTER =====
let searchDebounce;
searchInput.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(applyFiltersAndSort, 200);
});

filterSetor.addEventListener('change', applyFiltersAndSort);

// ===== DELETE MODAL =====
function openDeleteModal(id) {
  pendingDeleteId = id;
  const ativo = ativos.find(a => a.id === id);
  if (ativo) {
    modalDesc.textContent = `Remover "${ativo.modelo}" (${ativo.tipo}) de ${ativo.colaborador}? Esta ação não pode ser desfeita.`;
  }
  modalOverlay.classList.remove('hidden');
}

btnModalCancel.addEventListener('click', () => {
  modalOverlay.classList.add('hidden');
  pendingDeleteId = null;
});

modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) {
    modalOverlay.classList.add('hidden');
    pendingDeleteId = null;
  }
});

btnModalConfirm.addEventListener('click', async () => {
  if (pendingDeleteId === null) return;
  const id = pendingDeleteId;
  modalOverlay.classList.add('hidden');
  pendingDeleteId = null;

  try {
    const res = await fetch(`${API_BASE}/ativos/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Delete failed');
    ativos = ativos.filter(a => a.id !== id);
    applyFiltersAndSort();
    updateStats();
    setOnline(true);
  } catch (err) {
    setOnline(false);
    alert('Erro ao remover ativo. Verifique se o servidor está ativo.');
  }
});

// ===== KEYBOARD =====
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !modalOverlay.classList.contains('hidden')) {
    modalOverlay.classList.add('hidden');
    pendingDeleteId = null;
  }
});

// ===== UTILS =====
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== INIT =====
fetchAtivos();
