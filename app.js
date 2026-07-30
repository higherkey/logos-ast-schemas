let catalogData = [];
let selectedSchemaId = null;
let currentSchemaJson = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadCatalog();
  setupEventListeners();
  handleUrlRouting();
});

async function loadCatalog() {
  try {
    const res = await fetch('schemas/index.json');
    if (!res.ok) throw new Error('Failed to load catalog');
    const data = await res.json();
    catalogData = data.schemas || [];
    renderSidebarList(catalogData);
  } catch (err) {
    console.error('Error loading catalog:', err);
    document.getElementById('sidebar-list').innerHTML = `
      <div style="padding: 16px; color: var(--text-muted);">
        Unable to load schemas.
      </div>
    `;
  }
}

function renderSidebarList(schemas) {
  const container = document.getElementById('sidebar-list');
  if (!schemas || schemas.length === 0) {
    container.innerHTML = `
      <div style="padding: 16px; color: var(--text-muted); font-size: 12px;">
        No systems match search.
      </div>
    `;
    return;
  }

  container.innerHTML = schemas.map(s => `
    <div class="sidebar-item ${s.id === selectedSchemaId ? 'active' : ''}" 
         onclick="selectSchema('${s.id}')"
         role="option"
         aria-selected="${s.id === selectedSchemaId}">
      <span class="item-name">${escapeHtml(s.name)}</span>
      <div class="item-meta">${escapeHtml(s.license_type)} • ${escapeHtml(s.version)}</div>
    </div>
  `).join('');
}

function navigateTo(pageName) {
  const pages = ['overview', 'values', 'roadmap', 'registry'];
  pages.forEach(p => {
    const el = document.getElementById(`page-${p}`);
    if (el) el.style.display = p === pageName ? (p === 'registry' ? 'flex' : 'block') : 'none';
  });

  const links = document.querySelectorAll('.nav-link');
  links.forEach(l => {
    if (l.getAttribute('data-page') === pageName) {
      l.classList.add('active');
    } else {
      l.classList.remove('active');
    }
  });

  if (pageName === 'registry') {
    if (catalogData.length > 0 && !selectedSchemaId) {
      selectSchema(catalogData[0].id);
    }
    window.history.pushState(null, '', '#registry');
  } else {
    selectedSchemaId = null;
    window.history.pushState(null, '', `#${pageName}`);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function selectSchema(schemaId) {
  selectedSchemaId = schemaId;
  renderSidebarList(getFilteredSchemas());

  const schemaMeta = catalogData.find(s => s.id === schemaId);
  if (!schemaMeta) return;

  const pages = ['overview', 'values', 'roadmap', 'registry'];
  pages.forEach(p => {
    const el = document.getElementById(`page-${p}`);
    if (el) el.style.display = p === 'registry' ? 'flex' : 'none';
  });

  const links = document.querySelectorAll('.nav-link');
  links.forEach(l => {
    if (l.getAttribute('data-page') === 'registry') {
      l.classList.add('active');
    } else {
      l.classList.remove('active');
    }
  });

  window.history.pushState(null, '', `#registry/${schemaId}`);

  document.getElementById('spec-title').textContent = `${schemaMeta.name} (${schemaMeta.version})`;
  document.getElementById('spec-meta').textContent = `Engine: ${schemaMeta.engine_family || schemaMeta.system_family} • License: ${schemaMeta.license_type} • Status: ${schemaMeta.status}`;

  const copyBtn = document.getElementById('spec-copy-btn');
  const downloadBtn = document.getElementById('spec-download-btn');
  const jsonBlock = document.getElementById('spec-json-code');
  const mechanicsBody = document.getElementById('spec-mechanics-body');

  downloadBtn.href = schemaMeta.schema_file;
  downloadBtn.setAttribute('download', `${schemaMeta.id}.json`);

  copyBtn.onclick = () => {
    const fullUrl = new URL(schemaMeta.schema_file, window.location.href).href;
    navigator.clipboard.writeText(fullUrl).then(() => {
      copyBtn.textContent = '✓ Copied Endpoint URL';
      setTimeout(() => copyBtn.textContent = 'Copy Endpoint URL', 2000);
    });
  };

  jsonBlock.textContent = 'Loading AST schema execution tree...';
  switchSpecTab('json');

  try {
    const res = await fetch(schemaMeta.schema_file);
    currentSchemaJson = await res.json();
    jsonBlock.textContent = JSON.stringify(currentSchemaJson, null, 2);
    renderOutcomeBranches(currentSchemaJson);
    
    mechanicsBody.innerHTML = `
      This AST schema defines the deterministic execution rules for <strong>${escapeHtml(schemaMeta.name)}</strong> (${escapeHtml(schemaMeta.version)}). 
      Function Contract: <code>${escapeHtml(schemaMeta.function_contract || 'eval')}</code>.
      When a player triggers an action, the Project Logos core engine computes this exact formula tree without relying on probabilistic LLM text generation.
    `;
  } catch (err) {
    jsonBlock.textContent = `Error loading schema details: ${err.message}`;
    currentSchemaJson = null;
  }
}

function renderOutcomeBranches(json) {
  const container = document.getElementById('spec-branches-container');
  if (!json || !json.ast_nodes || !json.ast_nodes.evaluation) {
    container.innerHTML = `
      <div style="color: var(--text-muted); padding: 12px 0;">
        No outcome branch visualizer available for this schema.
      </div>
    `;
    return;
  }

  const evalObj = json.ast_nodes.evaluation;
  const branches = evalObj.branches || evalObj.base_calculation || evalObj.degree_eval || [];

  if (!branches || branches.length === 0) {
    container.innerHTML = `
      <div style="color: var(--text-muted); padding: 12px 0;">
        Schema uses specialized rule evaluation nodes. See JSON specification for complete AST definition.
      </div>
    `;
    return;
  }

  container.innerHTML = branches.map(b => `
    <div class="branch-item">
      <div class="branch-cond">IF ${escapeHtml(JSON.stringify(b.condition))}</div>
      <div class="branch-label">${escapeHtml(b.result || b.narrative || 'OUTCOME')}</div>
      <div class="branch-text">${escapeHtml(b.narrative_outcome || b.narrative || '')}</div>
    </div>
  `).join('');
}

function switchSpecTab(tabName) {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(t => t.classList.remove('active'));
  
  const activeTab = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
  if (activeTab) activeTab.classList.add('active');

  document.getElementById('tab-view-json').style.display = tabName === 'json' ? 'block' : 'none';
  document.getElementById('tab-view-branches').style.display = tabName === 'branches' ? 'block' : 'none';
  document.getElementById('tab-view-mechanics').style.display = tabName === 'mechanics' ? 'block' : 'none';
}

function getFilteredSchemas() {
  const query = (document.getElementById('search-input')?.value || '').toLowerCase().trim();

  return catalogData.filter(s => {
    return !query || 
      s.name.toLowerCase().includes(query) ||
      s.description.toLowerCase().includes(query) ||
      (s.engine_family && s.engine_family.toLowerCase().includes(query)) ||
      s.license_type.toLowerCase().includes(query);
  });
}

function setupEventListeners() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const filtered = getFilteredSchemas();
      renderSidebarList(filtered);
    });
  }

  window.addEventListener('popstate', handleUrlRouting);
}

function handleUrlRouting() {
  const hash = window.location.hash.replace('#', '');
  if (hash.startsWith('registry/')) {
    const schemaId = hash.replace('registry/', '');
    if (catalogData.some(s => s.id === schemaId)) {
      selectSchema(schemaId);
      return;
    }
  }
  
  if (hash === 'registry') {
    navigateTo('registry');
  } else if (hash === 'values') {
    navigateTo('values');
  } else if (hash === 'roadmap') {
    navigateTo('roadmap');
  } else {
    navigateTo('overview');
  }
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, match => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[match]));
}
