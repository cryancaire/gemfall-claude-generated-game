import { PROMPTS } from '../data/prompts.js';

export class PromptModal {
  constructor() {
    this._overlay  = document.getElementById('prompt-overlay');
    this._panel    = document.getElementById('prompt-panel');
    this._list     = document.getElementById('prompt-list');
    this._detail   = document.getElementById('prompt-detail');
    this._closeBtn = document.getElementById('prompt-close');
    this._triggerBtn = document.getElementById('prompt-trigger');

    this._selectedId = null;
    this._open = false;

    this._buildList();
    this._bindEvents();
  }

  // ---- Build ----

  _buildList() {
    this._list.innerHTML = '';
    for (const p of PROMPTS) {
      const item = document.createElement('button');
      item.className = 'pm-item';
      item.dataset.id = p.id;
      item.innerHTML = `
        <span class="pm-item-num">#${p.id}</span>
        <span class="pm-item-title">${p.title}</span>
        <span class="pm-item-date">${p.date}</span>
      `;
      item.addEventListener('click', () => this._selectPrompt(p.id));
      this._list.appendChild(item);
    }
  }

  _selectPrompt(id) {
    this._selectedId = id;
    const p = PROMPTS.find(x => x.id === id);
    if (!p) return;

    // Highlight active list item
    for (const el of this._list.querySelectorAll('.pm-item')) {
      el.classList.toggle('pm-item--active', Number(el.dataset.id) === id);
    }

    // Render detail pane
    this._detail.innerHTML = `
      <div class="pm-detail-header">
        <span class="pm-detail-num">#${p.id}</span>
        <h2 class="pm-detail-title">${p.title}</h2>
        <span class="pm-detail-date">${p.date}</span>
      </div>
      <pre class="pm-detail-text">${this._escapeHtml(p.text)}</pre>
    `;
  }

  _escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ---- Events ----

  _bindEvents() {
    this._triggerBtn.addEventListener('click', () => this.toggle());
    this._closeBtn.addEventListener('click',   () => this.close());

    // Close when clicking the overlay backdrop (outside the panel)
    this._overlay.addEventListener('click', e => {
      if (e.target === this._overlay) this.close();
    });

    // Pause game input while modal is open
    document.addEventListener('keydown', e => {
      if (!this._open) return;
      if (e.key === 'Escape') this.close();
      // Block game keys from passing through
      e.stopPropagation();
    }, true);
  }

  // ---- Open / close ----

  open() {
    this._open = true;
    this._overlay.classList.add('pm-visible');
    // Auto-select first prompt if none selected
    if (this._selectedId === null && PROMPTS.length > 0) {
      this._selectPrompt(PROMPTS[0].id);
    }
  }

  close() {
    this._open = false;
    this._overlay.classList.remove('pm-visible');
  }

  toggle() {
    this._open ? this.close() : this.open();
  }
}
