(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Loot Table
  // ---------------------------------------------------------------------------

  const LOOT_TABLE = [
    // common (60%)
    { name: "Star Fragment",  emoji: "⭐",  rarity: "common",    desc: "A small piece of cosmic energy." },
    { name: "Focus Crystal",  emoji: "💎",  rarity: "common",    desc: "Sharpens your concentration." },
    { name: "Speed Boots",    emoji: "👟",  rarity: "common",    desc: "You move a little faster today." },
    { name: "Energy Drink",   emoji: "⚡",  rarity: "common",    desc: "+10% productivity for the hour." },
    { name: "Map Fragment",   emoji: "🗺️", rarity: "common",    desc: "Part of a larger picture." },
    // rare (30%)
    { name: "Nebula Core",    emoji: "🌌",  rarity: "rare",      desc: "Dense with stored potential." },
    { name: "Time Shard",     emoji: "⏳",  rarity: "rare",      desc: "A sliver of reclaimed time." },
    { name: "Moon Dust",      emoji: "🌙",  rarity: "rare",      desc: "Collected from the lunar surface." },
    { name: "Warp Drive",     emoji: "🚀",  rarity: "rare",      desc: "Doubles your next mission's XP." },
    // legendary (10%)
    { name: "Cosmic Key",     emoji: "🗝️", rarity: "legendary", desc: "Opens doors that were never there." },
    { name: "Phoenix Feather",emoji: "🔥",  rarity: "legendary", desc: "Rise from any setback." },
    { name: "Galaxy Orb",     emoji: "🔮",  rarity: "legendary", desc: "You can see every possible outcome." },
  ];

  const RARITY_ORDER = { legendary: 0, rare: 1, common: 2 };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function generateId() {
    return 'loot_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  function ensureLoot(state) {
    if (!state.loot || !Array.isArray(state.loot.inventory)) {
      state.loot = { inventory: [] };
    }
  }

  function pickRarity() {
    const roll = Math.random();
    if (roll < 0.10) return 'legendary';
    if (roll < 0.40) return 'rare';
    return 'common';
  }

  function pickItem(rarity) {
    const pool = LOOT_TABLE.filter(item => item.rarity === rarity);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function formatRarity(r) {
    return r.charAt(0).toUpperCase() + r.slice(1);
  }

  // ---------------------------------------------------------------------------
  // Toast Notification
  // ---------------------------------------------------------------------------

  function showToast(item) {
    const toast = document.createElement('div');
    toast.className = 'loot-drop-toast';
    toast.innerHTML = `
      <span class="toast-emoji">${item.emoji}</span>
      <span class="toast-text">
        <strong>Loot Drop!</strong>
        <span>${item.name}</span>
        <span class="loot-rarity ${item.rarity}">${formatRarity(item.rarity)}</span>
      </span>
    `;
    document.body.appendChild(toast);

    // Trigger fade-in on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('loot-drop-toast--visible'));
    });

    setTimeout(() => {
      toast.classList.remove('loot-drop-toast--visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
      // Fallback removal in case transitionend never fires
      setTimeout(() => { if (toast.parentNode) toast.remove(); }, 600);
    }, 3500);
  }

  // ---------------------------------------------------------------------------
  // Task Complete Hook
  // ---------------------------------------------------------------------------

  function onTaskComplete() {
    // 35% chance of a loot drop
    if (Math.random() > 0.35) return;

    const state = window.APP.getState();
    ensureLoot(state);

    const rarity = pickRarity();
    const template = pickItem(rarity);
    if (!template) return;

    const item = {
      id:       generateId(),
      name:     template.name,
      emoji:    template.emoji,
      rarity:   template.rarity,
      desc:     template.desc,
      earnedAt: new Date().toISOString(),
    };

    state.loot.inventory.push(item);
    window.APP.touchState();
    window.APP.persist();

    showToast(item);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  function render() {
    const el = document.getElementById('loot-inventory');
    if (!el) return;

    const state = window.APP.getState();
    ensureLoot(state);

    const inventory = [...state.loot.inventory].sort((a, b) => {
      const diff = RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
      if (diff !== 0) return diff;
      // Secondary: most recently earned first
      return new Date(b.earnedAt) - new Date(a.earnedAt);
    });

    const count = inventory.length;

    if (count === 0) {
      el.innerHTML = `
        <div class="section-card">
          <div class="section-label">Your Inventory (0 items)</div>
          <div class="hint-row">Complete missions to earn loot drops.</div>
        </div>
      `;
      return;
    }

    const cards = inventory.map(item => `
      <div class="loot-card ${item.rarity}" title="${item.desc}">
        <div class="loot-emoji">${item.emoji}</div>
        <div class="loot-name">${item.name}</div>
        <div class="loot-rarity ${item.rarity}">${formatRarity(item.rarity)}</div>
        <div class="loot-desc">${item.desc}</div>
      </div>
    `).join('');

    el.innerHTML = `
      <div class="section-card">
        <div class="section-label">Your Inventory (${count} item${count === 1 ? '' : 's'})</div>
        <div class="loot-grid">${cards}</div>
      </div>
    `;
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------

  function init() {
    const state = window.APP.getState();
    ensureLoot(state);
  }

  // ---------------------------------------------------------------------------
  // Register
  // ---------------------------------------------------------------------------

  window.APP.modules.loot = { init, render };
  window.APP.renderHooks.push(render);
  window.APP.taskCompleteHooks.push(onTaskComplete);

  // Run init immediately if APP is already ready, otherwise defer
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
