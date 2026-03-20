(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Loot Table  (each item now has a `slot` field for the equipment system)
  // ---------------------------------------------------------------------------

  const LOOT_TABLE = [
    // Weapons — slot: 'weapon'  (XP bonuses)
    { name: "Star Fragment",   emoji: "⭐",  rarity: "common",    slot: "weapon",     desc: "A small piece of cosmic energy.",          bonus: "+10% XP on every mission" },
    { name: "Warp Drive",      emoji: "🚀",  rarity: "rare",      slot: "weapon",     desc: "Doubles your next mission's XP.",          bonus: "+25% XP on every mission" },
    { name: "Nebula Core",     emoji: "🌌",  rarity: "rare",      slot: "weapon",     desc: "Dense with stored potential.",             bonus: "+20% XP on every mission" },
    // Armor — slot: 'armor'  (streak / defense bonuses)
    { name: "Phoenix Feather", emoji: "🔥",  rarity: "legendary", slot: "armor",      desc: "Rise from any setback.",                   bonus: "Streak Shield — protects streak on missed day" },
    { name: "Cosmic Shield",   emoji: "🛡️", rarity: "rare",      slot: "armor",      desc: "An impenetrable barrier of star-stuff.",   bonus: "Streak Shield — protects streak on missed day" },
    // Accessories — slot: 'accessory'  (focus / productivity bonuses)
    { name: "Focus Crystal",   emoji: "💎",  rarity: "common",    slot: "accessory",  desc: "Sharpens your concentration.",             bonus: "+10 min to every focus session" },
    { name: "Time Shard",      emoji: "⏳",  rarity: "rare",      slot: "accessory",  desc: "A sliver of reclaimed time.",              bonus: "+15 min to every focus session" },
    { name: "Energy Drink",    emoji: "⚡",  rarity: "common",    slot: "accessory",  desc: "+10% productivity for the hour.",          bonus: "+5 min to every focus session" },
    // Ship Modules — slot: 'shipModule'  (loot rate bonuses)
    { name: "Speed Boots",     emoji: "👟",  rarity: "common",    slot: "shipModule", desc: "You move a little faster today.",          bonus: "+5% loot drop rate" },
    { name: "Map Fragment",    emoji: "🗺️", rarity: "common",    slot: "shipModule", desc: "Part of a larger picture.",               bonus: "+5% loot drop rate" },
    { name: "Moon Dust",       emoji: "🌙",  rarity: "rare",      slot: "shipModule", desc: "Collected from the lunar surface.",        bonus: "+10% loot drop rate" },
    { name: "Cosmic Key",      emoji: "🗝️", rarity: "legendary", slot: "shipModule", desc: "Opens doors that were never there.",       bonus: "+20% loot drop rate" },
    { name: "Galaxy Orb",      emoji: "🔮",  rarity: "legendary", slot: "shipModule", desc: "You can see every possible outcome.",      bonus: "+15% loot drop rate" },
  ];

  const SLOT_LABELS = {
    weapon:     "⚔️ Weapon",
    armor:      "🛡 Armor",
    accessory:  "💍 Accessory",
    shipModule: "🛸 Ship Module",
  };

  const RARITY_ORDER = { legendary: 0, rare: 1, common: 2 };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function generateId() {
    return 'loot_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
  }

  function ensureLoot(state) {
    if (!state.loot || !Array.isArray(state.loot.inventory)) {
      state.loot = { inventory: [], activeBoost: null, streakShield: false, focusBonus: 0,
                     equipped: { weapon: null, armor: null, accessory: null, shipModule: null } };
    }
    if (!('activeBoost'  in state.loot)) state.loot.activeBoost  = null;
    if (!('streakShield' in state.loot)) state.loot.streakShield = false;
    if (!('focusBonus'   in state.loot)) state.loot.focusBonus   = 0;
    if (!state.loot.equipped || typeof state.loot.equipped !== 'object') {
      state.loot.equipped = { weapon: null, armor: null, accessory: null, shipModule: null };
    }
    // Ensure all four slot keys exist
    for (const slot of ['weapon', 'armor', 'accessory', 'shipModule']) {
      if (!(slot in state.loot.equipped)) state.loot.equipped[slot] = null;
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

  // Return the LOOT_TABLE definition for an inventory item (matched by name)
  function getTemplate(item) {
    return LOOT_TABLE.find(t => t.name === item.name) || null;
  }

  // ---------------------------------------------------------------------------
  // Equipment Bonuses  (exported via APP so script.js can call it)
  // ---------------------------------------------------------------------------

  function getEquipmentBonuses(state) {
    ensureLoot(state);
    const bonuses = {
      xpBonus:      1.0,   // multiplier applied to earned XP
      lootRate:     0.15,  // base drop chance
      streakShield: false, // replaces the consumed-on-use shield
      focusBonus:   0,     // extra minutes added to focus sessions
    };

    const equipped = state.loot.equipped;
    for (const slot of ['weapon', 'armor', 'accessory', 'shipModule']) {
      const itemId = equipped[slot];
      if (!itemId) continue;
      const invItem = state.loot.inventory.find(i => i.id === itemId);
      if (!invItem) continue;
      const tpl = getTemplate(invItem);
      const name = invItem.name;

      switch (slot) {
        case 'weapon':
          if (name === 'Warp Drive')    bonuses.xpBonus += 0.25;
          else if (name === 'Nebula Core') bonuses.xpBonus += 0.20;
          else                          bonuses.xpBonus += 0.10; // Star Fragment / fallback
          break;
        case 'armor':
          bonuses.streakShield = true;
          break;
        case 'accessory':
          if (name === 'Time Shard')    bonuses.focusBonus += 15;
          else if (name === 'Focus Crystal') bonuses.focusBonus += 10;
          else                          bonuses.focusBonus += 5;  // Energy Drink / fallback
          break;
        case 'shipModule':
          if (name === 'Cosmic Key')    bonuses.lootRate += 0.20;
          else if (name === 'Galaxy Orb') bonuses.lootRate += 0.15;
          else if (name === 'Moon Dust')  bonuses.lootRate += 0.10;
          else                          bonuses.lootRate += 0.05; // Speed Boots / Map Fragment
          break;
      }
    }
    return bonuses;
  }

  // ---------------------------------------------------------------------------
  // Equip / Unequip
  // ---------------------------------------------------------------------------

  function equipItem(itemId) {
    const state = window.APP.getState();
    ensureLoot(state);

    const item = state.loot.inventory.find(i => i.id === itemId);
    if (!item) return;

    const tpl = getTemplate(item);
    const slot = tpl ? tpl.slot : item.slot;
    if (!slot) return;

    // Ensure the item record carries the slot field (for items dropped before slot was added)
    if (!item.slot) item.slot = slot;

    // If this item is already equipped, unequip it
    if (state.loot.equipped[slot] === itemId) {
      state.loot.equipped[slot] = null;
    } else {
      // Equip (replaces any existing item in that slot)
      state.loot.equipped[slot] = itemId;
    }

    window.APP.touchState();
    // persist() calls persistAndRender() which fires all renderHooks (including this render fn)
    window.APP.persist();
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

    requestAnimationFrame(() => {
      requestAnimationFrame(() => toast.classList.add('loot-drop-toast--visible'));
    });

    setTimeout(() => {
      toast.classList.remove('loot-drop-toast--visible');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
      setTimeout(() => { if (toast.parentNode) toast.remove(); }, 600);
    }, 3500);
  }

  // ---------------------------------------------------------------------------
  // Task Complete Hook
  // ---------------------------------------------------------------------------

  function onTaskComplete() {
    // Use equipment-aware loot rate (getEquipmentBonuses reads state internally)
    const state = window.APP.getState();
    ensureLoot(state);
    const bonuses = getEquipmentBonuses(state);

    if (Math.random() > bonuses.lootRate) return;

    const rarity = pickRarity();
    const template = pickItem(rarity);
    if (!template) return;

    const item = {
      id:       generateId(),
      name:     template.name,
      emoji:    template.emoji,
      rarity:   template.rarity,
      slot:     template.slot,
      desc:     template.desc,
      earnedAt: new Date().toISOString(),
    };

    state.loot.inventory.push(item);
    window.APP.touchState();
    window.APP.persist();

    showToast(item);
  }

  // ---------------------------------------------------------------------------
  // Render — Loadout + Inventory
  // ---------------------------------------------------------------------------

  function renderLoadout(state) {
    const equipped = state.loot.equipped;
    const inventory = state.loot.inventory;

    const slots = ['weapon', 'armor', 'accessory', 'shipModule'];
    const hasAnyEquipped = slots.some(s => equipped[s] !== null);

    const slotCards = slots.map(slot => {
      const itemId = equipped[slot];
      const item = itemId ? inventory.find(i => i.id === itemId) : null;
      if (item) {
        const tpl = getTemplate(item);
        const bonus = tpl ? tpl.bonus : '';
        return `
          <div class="loadout-slot loadout-slot--filled ${item.rarity}" data-slot="${slot}">
            <div class="loadout-slot-label">${SLOT_LABELS[slot]}</div>
            <div class="loadout-slot-emoji">${item.emoji}</div>
            <div class="loadout-slot-name">${item.name}</div>
            <div class="loadout-slot-bonus">${bonus}</div>
            <button class="loot-equip-btn loot-equip-btn--unequip ${item.rarity}" data-loot-id="${item.id}">Unequip</button>
          </div>
        `;
      } else {
        return `
          <div class="loadout-slot loadout-slot--empty" data-slot="${slot}">
            <div class="loadout-slot-label">${SLOT_LABELS[slot]}</div>
            <div class="loadout-slot-empty-hint">Empty</div>
          </div>
        `;
      }
    }).join('');

    // Active bonuses summary
    const bonuses = getEquipmentBonuses(state);
    const bonusParts = [];
    if (bonuses.xpBonus > 1.0) bonusParts.push(`+${Math.round((bonuses.xpBonus - 1) * 100)}% XP`);
    if (bonuses.lootRate > 0.15) bonusParts.push(`${Math.round(bonuses.lootRate * 100)}% Loot Rate`);
    if (bonuses.streakShield) bonusParts.push('Streak Shield Active');
    if (bonuses.focusBonus > 0) bonusParts.push(`+${bonuses.focusBonus} min Focus`);
    const bonusSummary = bonusParts.length
      ? `<div class="loadout-active-bonuses">Active Bonuses: ${bonusParts.join(' · ')}</div>`
      : `<div class="loadout-active-bonuses loadout-active-bonuses--none">No bonuses active — equip items to activate passive effects.</div>`;

    return `
      <div class="section-card loadout-section">
        <div class="section-label">Loadout</div>
        ${bonusSummary}
        <div class="loadout-grid">${slotCards}</div>
      </div>
    `;
  }

  function render() {
    const el = document.getElementById('loot-inventory');
    if (!el) return;

    const state = window.APP.getState();
    ensureLoot(state);

    const equipped = state.loot.equipped;

    const inventory = [...state.loot.inventory].sort((a, b) => {
      const diff = RARITY_ORDER[a.rarity] - RARITY_ORDER[b.rarity];
      if (diff !== 0) return diff;
      return new Date(b.earnedAt) - new Date(a.earnedAt);
    });

    const count = inventory.length;

    // Always render the loadout section
    const loadoutHtml = renderLoadout(state);

    if (count === 0) {
      el.innerHTML = loadoutHtml + `
        <div class="section-card">
          <div class="section-label">Your Inventory (0 items)</div>
          <div class="hint-row">Complete missions to earn loot drops.</div>
        </div>
      `;
      // Still bind unequip buttons that may be in loadout
      bindEquipButtons(el, state);
      return;
    }

    const cards = inventory.map(item => {
      const tpl = getTemplate(item);
      const slot = item.slot || (tpl ? tpl.slot : null);
      const bonus = tpl ? tpl.bonus : '';
      const slotLabel = slot ? SLOT_LABELS[slot] : '';
      const isEquipped = slot ? equipped[slot] === item.id : false;
      const btnClass = isEquipped ? 'loot-equip-btn--unequip' : 'loot-equip-btn--equip';
      const btnLabel = isEquipped ? 'Unequip' : 'Equip';

      return `
        <div class="loot-card ${item.rarity}${isEquipped ? ' loot-card--equipped' : ''}" title="${item.desc}">
          <div class="loot-slot-badge">${slotLabel}</div>
          <div class="loot-emoji">${item.emoji}</div>
          <div class="loot-name">${item.name}</div>
          <div class="loot-rarity ${item.rarity}">${formatRarity(item.rarity)}</div>
          <div class="loot-desc">${item.desc}</div>
          <div class="loot-effect-hint">${bonus}</div>
          <button class="loot-equip-btn ${btnClass} ${item.rarity}" data-loot-id="${item.id}">${btnLabel}</button>
        </div>
      `;
    }).join('');

    el.innerHTML = loadoutHtml + `
      <div class="section-card">
        <div class="section-label">Your Inventory (${count} item${count === 1 ? '' : 's'})</div>
        <div class="loot-grid">${cards}</div>
      </div>
    `;

    bindEquipButtons(el, state);
  }

  function bindEquipButtons(el, state) {
    el.querySelectorAll('.loot-equip-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        equipItem(btn.dataset.lootId);
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

  window.APP.modules.loot = { init, render, getEquipmentBonuses };
  window.APP.renderHooks.push(render);
  window.APP.taskCompleteHooks.push(onTaskComplete);

  // Expose getEquipmentBonuses globally for script.js to call
  window.APP.getEquipmentBonuses = getEquipmentBonuses;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
