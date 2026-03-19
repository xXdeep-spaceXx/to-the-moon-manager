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
      state.loot = { inventory: [], activeBoost: null, streakShield: false };
    }
    if (!('activeBoost' in state.loot))  state.loot.activeBoost  = null;
    if (!('streakShield' in state.loot)) state.loot.streakShield = false;
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
  // Item Effects
  // ---------------------------------------------------------------------------

  /**
   * Determine the mechanical effect of an item based on its name and rarity.
   * Returns an object: { type, label, description }
   */
  function getItemEffect(item) {
    if (/xp.?boost|warp.?drive|nebula|star.?fragment|energy/i.test(item.name)) {
      return {
        type: 'xp2x',
        label: '⚡ XP Boost activated!',
        description: 'Next task completed earns double XP.'
      };
    }
    if (/shield|phoenix|protect/i.test(item.name)) {
      return {
        type: 'streak_shield',
        label: '🛡️ Streak Shield activated!',
        description: 'Your streak is protected for one missed day.'
      };
    }
    if (/focus|crystal|time.?shard|clock|shard/i.test(item.name)) {
      return {
        type: 'focus_boost',
        label: '🎯 Focus Boost activated!',
        description: '+10 minutes added to your next focus session.'
      };
    }
    if (item.rarity === 'legendary') {
      return {
        type: 'bonus_xp_legendary',
        label: '🌟 Legendary Power!',
        description: '+100 XP granted instantly.'
      };
    }
    // default: common/rare items without a keyword match → grant 20 XP
    return {
      type: 'bonus_xp_common',
      label: '✨ Item used!',
      description: '+20 XP granted.'
    };
  }

  /**
   * Show a toast notification for an activated loot effect.
   */
  function showEffectToast(effect) {
    const toast = document.createElement('div');
    toast.className = 'loot-drop-toast loot-effect-toast';
    toast.innerHTML = `
      <span class="toast-emoji">${effect.label.split(' ')[0]}</span>
      <span class="toast-text">
        <strong>${effect.label.replace(/^.\S+\s/, '')}</strong>
        <span>${effect.description}</span>
      </span>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('loot-drop-toast--visible'));
    });

    setTimeout(() => {
      toast.classList.remove('loot-drop-toast--visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
      setTimeout(() => { if (toast.parentNode) toast.remove(); }, 600);
    }, 4000);
  }

  /**
   * Apply a loot item's effect to state and remove it from inventory.
   */
  function useLootItem(itemId) {
    const state = window.APP.getState();
    ensureLoot(state);

    const idx = state.loot.inventory.findIndex(i => i.id === itemId);
    if (idx === -1) return;

    const item = state.loot.inventory[idx];
    const effect = getItemEffect(item);

    // Apply effect
    switch (effect.type) {
      case 'xp2x':
        state.loot.activeBoost = { type: 'xp2x', expires: 'next_task' };
        break;
      case 'streak_shield':
        state.loot.streakShield = true;
        break;
      case 'focus_boost':
        state.loot.focusBonus = (state.loot.focusBonus || 0) + 10;
        break;
      case 'bonus_xp_legendary':
        window.APP.gainXP(100);
        break;
      case 'bonus_xp_common':
      default:
        window.APP.gainXP(20);
        break;
    }

    // Remove item from inventory
    state.loot.inventory.splice(idx, 1);

    window.APP.touchState();
    window.APP.persist();

    showEffectToast(effect);
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

    const cards = inventory.map(item => {
      const effect = getItemEffect(item);
      return `
        <div class="loot-card ${item.rarity}" title="${item.desc}">
          <div class="loot-emoji">${item.emoji}</div>
          <div class="loot-name">${item.name}</div>
          <div class="loot-rarity ${item.rarity}">${formatRarity(item.rarity)}</div>
          <div class="loot-desc">${item.desc}</div>
          <div class="loot-effect-hint">${effect.description}</div>
          <button class="loot-use-btn ${item.rarity}" data-loot-id="${item.id}">Use</button>
        </div>
      `;
    }).join('');

    el.innerHTML = `
      <div class="section-card">
        <div class="section-label">Your Inventory (${count} item${count === 1 ? '' : 's'})</div>
        <div class="loot-grid">${cards}</div>
      </div>
    `;

    // Event delegation for "Use" buttons
    el.querySelectorAll('.loot-use-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        useLootItem(btn.dataset.lootId);
      });
    });
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
