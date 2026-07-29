let catalogData = [];

document.addEventListener('DOMContentLoaded', async () => {
  await loadCatalog();
  setupEventListeners();
});

async function loadCatalog() {
  try {
    const res = await fetch('schemas/index.json');
    if (!res.ok) throw new Error('Failed to load catalog');
    const data = await res.json();
    catalogData = data.schemas || [];
    renderSchemas(catalogData);
  } catch (err) {
    console.error('Error loading AST catalog:', err);
    document.getElementById('schemas-container').innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">
        <p>⚠️ Unable to load AST schemas catalog. Please check network or file path.</p>
      </div>
    `;
  }
}

function renderSchemas(schemas) {
  const container = document.getElementById('schemas-container');
  if (!schemas || schemas.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">
        <p>No matching AST schemas found.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = schemas.map(schema => `
    <article class="card">
      <div>
        <div class="card-header">
          <h3 class="card-title">${escapeHtml(schema.name)}</h3>
          <span class="tag-badge">${escapeHtml(schema.version)}</span>
        </div>
        <p class="card-desc">${escapeHtml(schema.description)}</p>
        <div class="meta-row">
          <span class="meta-chip">🔓 ${escapeHtml(schema.license_type)}</span>
          <span class="meta-chip">📦 ${escapeHtml(schema.status)}</span>
          ${(schema.tags || []).map(t => `<span class="meta-chip">#${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>
      <div class="card-actions">
        <button class="btn btn-primary" style="flex:1;" onclick="inspectSchema('${schema.id}')">Inspect Schema</button>
        <button class="btn btn-secondary" onclick="copySchemaUrl('${schema.schema_file}', this)">Copy Raw URL</button>
      </div>
    </article>
  `).join('');
}

async function inspectSchema(schemaId) {
  const schemaMeta = catalogData.find(s => s.id === schemaId);
  if (!schemaMeta) return;

  const modal = document.getElementById('inspect-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalCode = document.getElementById('modal-code');

  modalTitle.textContent = `${schemaMeta.name} (${schemaMeta.version})`;
  modalCode.textContent = 'Loading schema details...';
  modal.classList.add('open');

  try {
    const res = await fetch(schemaMeta.schema_file);
    const json = await res.json();
    modalCode.textContent = JSON.stringify(json, null, 2);
  } catch (err) {
    modalCode.textContent = `Error loading schema file: ${err.message}`;
  }
}

function closeModal() {
  document.getElementById('inspect-modal').classList.remove('open');
}

function copySchemaUrl(filePath, btnEl) {
  const fullUrl = new URL(filePath, window.location.href).href;
  navigator.clipboard.writeText(fullUrl).then(() => {
    const origText = btnEl.textContent;
    btnEl.textContent = '✓ Copied!';
    setTimeout(() => btnEl.textContent = origText, 2000);
  }).catch(err => {
    alert(`Schema URL: ${fullUrl}`);
  });
}

function setupEventListeners() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const filtered = catalogData.filter(s => 
        s.name.toLowerCase().includes(query) ||
        s.description.toLowerCase().includes(query) ||
        s.system_family.toLowerCase().includes(query) ||
        (s.tags && s.tags.some(t => t.toLowerCase().includes(query)))
      );
      renderSchemas(filtered);
    });
  }

  const pills = document.querySelectorAll('.pill');
  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      const category = pill.dataset.category;
      
      if (category === 'ALL') {
        renderSchemas(catalogData);
      } else {
        const filtered = catalogData.filter(s => s.system_family === category || s.license_type.includes(category));
        renderSchemas(filtered);
      }
    });
  });

  const closeBtn = document.getElementById('modal-close-btn');
  if (closeBtn) closeBtn.addEventListener('click', closeModal);

  const overlay = document.getElementById('inspect-modal');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
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
