(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  const MOOD_EMOJIS  = ["😴", "😐", "🙂", "😊", "🚀"];
  const MOOD_LABELS  = ["Drained", "Low", "Okay", "Good", "Fired up"];

  // Energy bar colours (index 0 = energy 1)
  const ENERGY_COLORS = ["#ff453a", "#ff9f0a", "#ffd60a", "#30d158", "#0a84ff"];

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function generateId() {
    return 'mood_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  function ensureMood(state) {
    if (!Array.isArray(state.mood)) {
      state.mood = [];
    }
  }

  function formatDate(dateStr) {
    // dateStr is "YYYY-MM-DD"
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ---------------------------------------------------------------------------
  // Check-in section
  // ---------------------------------------------------------------------------

  function renderCheckin() {
    const el = document.getElementById('mood-checkin');
    if (!el) return;

    const state = window.APP.getState();
    ensureMood(state);

    const today = todayStr();
    const existing = state.mood.find(e => e.date === today);

    if (existing) {
      const energyIdx = existing.energy - 1;
      const color = ENERGY_COLORS[energyIdx] || '#888';
      el.innerHTML = `
        <div class="section-card">
          <div class="section-label">Today's Check-in</div>
          <div class="mood-history-item">
            <div class="mood-history-emoji">${existing.emoji}</div>
            <div class="mood-history-info">
              <div class="mood-history-date">${formatDate(existing.date)}</div>
              ${existing.note ? `<div class="mood-history-note">${escapeHtml(existing.note)}</div>` : ''}
              <div class="mood-energy-bar" title="Energy: ${existing.energy}/5">
                <div class="mood-energy-fill" style="width:${(existing.energy / 5) * 100}%; background:${color};"></div>
              </div>
            </div>
          </div>
          <div class="hud-sub" style="margin-top:10px;">You've checked in today ✓</div>
        </div>
      `;
      return;
    }

    // Not logged yet — show the form
    // We store the selected energy level in a module-local variable so it
    // survives re-renders within the same session without touching state.
    el.innerHTML = `
      <div class="section-card">
        <div class="section-label">How are you feeling today?</div>
        <div class="mood-energy-row" id="mood-btn-row">
          ${MOOD_EMOJIS.map((emoji, i) => `
            <button class="mood-btn" data-energy="${i + 1}" title="${MOOD_LABELS[i]}" type="button">
              <span>${emoji}</span>
              <span class="hud-sub">${MOOD_LABELS[i]}</span>
            </button>
          `).join('')}
        </div>
        <input
          id="mood-note-input"
          type="text"
          placeholder="Optional note..."
          maxlength="140"
          autocomplete="off"
          style="width:100%;box-sizing:border-box;margin:12px 0 10px;"
        />
        <div style="display:flex;gap:8px;">
          <button class="btn-primary" id="mood-log-btn" type="button">Log Mood</button>
          <button class="btn-secondary" id="mood-clear-btn" type="button">Clear</button>
        </div>
      </div>
    `;

    // Restore any previously selected energy within this render cycle
    if (_pendingEnergy) {
      const btn = el.querySelector(`.mood-btn[data-energy="${_pendingEnergy}"]`);
      if (btn) btn.classList.add('selected');
    }
    if (_pendingNote) {
      const noteInput = el.querySelector('#mood-note-input');
      if (noteInput) noteInput.value = _pendingNote;
    }

    // Mood button selection
    el.querySelectorAll('.mood-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        el.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        _pendingEnergy = parseInt(btn.dataset.energy, 10);
      });
    });

    // Keep note in sync
    const noteEl = el.querySelector('#mood-note-input');
    if (noteEl) {
      noteEl.addEventListener('input', () => { _pendingNote = noteEl.value; });
    }

    // Log button
    const logBtn = el.querySelector('#mood-log-btn');
    if (logBtn) {
      logBtn.addEventListener('click', () => logMood(el));
    }

    // Clear button
    const clearBtn = el.querySelector('#mood-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        _pendingEnergy = null;
        _pendingNote   = '';
        el.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
        const ni = el.querySelector('#mood-note-input');
        if (ni) ni.value = '';
      });
    }
  }

  function logMood(checkinEl) {
    if (!_pendingEnergy) {
      // Flash the row to indicate selection is needed
      const row = checkinEl && checkinEl.querySelector('#mood-btn-row');
      if (row) {
        row.style.outline = '2px solid #ff453a';
        setTimeout(() => { row.style.outline = ''; }, 800);
      }
      return;
    }

    const state = window.APP.getState();
    ensureMood(state);

    const today = todayStr();
    // Guard against duplicate
    if (state.mood.find(e => e.date === today)) return;

    const energyIdx = _pendingEnergy - 1;
    const entry = {
      id:     generateId(),
      date:   today,
      energy: _pendingEnergy,
      emoji:  MOOD_EMOJIS[energyIdx],
      note:   _pendingNote.trim(),
    };

    state.mood.push(entry);
    _pendingEnergy = null;
    _pendingNote   = '';

    window.APP.touchState();
    window.APP.persist(); // persist() also triggers re-render in most setups

    // If persist() does not re-render automatically, do it manually
    renderCheckin();
    renderHistory();
  }

  // ---------------------------------------------------------------------------
  // History section
  // ---------------------------------------------------------------------------

  function renderHistory() {
    const el = document.getElementById('mood-history');
    if (!el) return;

    const state = window.APP.getState();
    ensureMood(state);

    if (state.mood.length === 0) {
      el.innerHTML = `
        <div class="section-card">
          <div class="section-label">Recent Check-ins</div>
          <div class="hint-row">No check-ins yet. Log your first one above.</div>
        </div>
      `;
      return;
    }

    // Sort descending by date, take last 14
    const recent = [...state.mood]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 14);

    const items = recent.map(entry => {
      const energyIdx  = Math.max(0, Math.min(4, entry.energy - 1));
      const color      = ENERGY_COLORS[energyIdx] || '#888';
      const pct        = ((entry.energy || 1) / 5) * 100;
      const label      = MOOD_LABELS[energyIdx] || '';
      return `
        <div class="mood-history-item">
          <div class="mood-history-emoji">${entry.emoji || MOOD_EMOJIS[energyIdx]}</div>
          <div class="mood-history-info">
            <div class="mood-history-date">${formatDate(entry.date)} &mdash; <span class="hud-sub">${label}</span></div>
            ${entry.note ? `<div class="mood-history-note">${escapeHtml(entry.note)}</div>` : ''}
            <div class="mood-energy-bar" title="Energy: ${entry.energy}/5">
              <div class="mood-energy-fill" style="width:${pct}%; background:${color};"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    el.innerHTML = `
      <div class="section-card">
        <div class="section-label">Recent Check-ins</div>
        <div class="mood-history-list">${items}</div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Escape helper (no external deps)
  // ---------------------------------------------------------------------------

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ---------------------------------------------------------------------------
  // Module-local transient UI state (not persisted)
  // ---------------------------------------------------------------------------

  let _pendingEnergy = null;
  let _pendingNote   = '';

  // ---------------------------------------------------------------------------
  // Render (called by renderHooks)
  // ---------------------------------------------------------------------------

  function render() {
    renderCheckin();
    renderHistory();
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------

  function init() {
    const state = window.APP.getState();
    ensureMood(state);
  }

  // ---------------------------------------------------------------------------
  // Register
  // ---------------------------------------------------------------------------

  window.APP.modules.mood = { init, render };
  window.APP.renderHooks.push(render);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
