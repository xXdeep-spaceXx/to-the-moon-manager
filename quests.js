(() => {
  'use strict';

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function getToday() {
    return new Date().toISOString().slice(0, 10);
  }

  function getWeekId() {
    const d = new Date();
    const day = d.getDay() || 7;
    d.setDate(d.getDate() + 4 - day);
    const year = d.getFullYear();
    const week = Math.ceil((((d - new Date(year, 0, 1)) / 86400000) + 1) / 7);
    return `${year}-W${String(week).padStart(2, '0')}`;
  }

  function daysUntilMonday() {
    const d = new Date();
    const day = d.getDay() || 7; // 1=Mon … 7=Sun
    return 8 - day;              // days until next Monday
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pickRandom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // ---------------------------------------------------------------------------
  // Quest generation
  // ---------------------------------------------------------------------------

  const QUEST_ICONS = ['⚔️', '🎯', '🔥', '🌟', '💪'];

  const BOSS_NAMES = [
    'The Procrastinator',
    'The Overwhelm',
    'The Distraction',
    'The Perfectionist',
    'The Burnout',
  ];

  const QUEST_TYPES = [
    'complete_any',
    'complete_category',
    'complete_hard',
    'maintain_streak',
    'complete_epic_subtask',
  ];

  function getCategoriesFromState(state) {
    const tasks = state.tasks || [];
    const cats = [...new Set(tasks.map(t => t.category).filter(Boolean))];
    return cats.length ? cats : ['General'];
  }

  function buildQuestDef(type, state) {
    const icon = pickRandom(QUEST_ICONS);
    const xpReward = randInt(50, 150);

    switch (type) {
      case 'complete_any':
        return { type, icon, desc: 'Complete 3 missions today', target: 3, xpReward };

      case 'complete_category': {
        const cats = getCategoriesFromState(state);
        const category = pickRandom(cats);
        return { type, icon, desc: `Complete a ${category} mission`, target: 1, xpReward, meta: { category } };
      }

      case 'complete_hard':
        return { type, icon, desc: 'Complete a Hard difficulty mission', target: 1, xpReward };

      case 'maintain_streak':
        return { type, icon, desc: 'Keep your streak alive', target: 1, xpReward };

      case 'complete_epic_subtask':
        return { type, icon, desc: 'Complete a subtask on an Epic', target: 1, xpReward };

      default:
        return { type, icon, desc: 'Complete a mission', target: 1, xpReward };
    }
  }

  function generateQuests(state) {
    const shuffled = [...QUEST_TYPES].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, 3);
    return chosen.map((type, i) => {
      const def = buildQuestDef(type, state);
      return {
        id: `quest-${Date.now()}-${i}`,
        progress: 0,
        claimed: false,
        ...def,
      };
    });
  }

  // ---------------------------------------------------------------------------
  // State bootstrap
  // ---------------------------------------------------------------------------

  function ensureQuestsState(state) {
    const today = getToday();

    if (!state.quests || state.quests.date !== today) {
      state.quests = {
        date: today,
        list: generateQuests(state),
      };
    }
  }

  function ensureBossState(state) {
    const weekId = getWeekId();

    if (!state.boss || state.boss.weekId !== weekId) {
      // Pick boss name deterministically-ish from week number
      const weekNum = parseInt(weekId.split('W')[1], 10);
      const bossTitle = BOSS_NAMES[weekNum % BOSS_NAMES.length];

      state.boss = {
        weekId,
        title: bossTitle,
        hp: 100,
        maxHp: 100,
        defeated: false,
        rewardClaimed: false,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // Progress calculation for a single quest
  // ---------------------------------------------------------------------------

  function computeQuestProgress(quest, state) {
    if (quest.claimed) return quest.progress; // frozen once claimed

    const today = getToday();
    const tasks = state.tasks || [];

    switch (quest.type) {
      case 'complete_any': {
        const count = tasks.filter(t => t.completed && t.completedDate === today).length;
        return Math.min(count, quest.target);
      }

      case 'complete_category': {
        const category = quest.meta && quest.meta.category;
        const done = tasks.some(
          t => t.completed && t.completedDate === today && t.category === category
        );
        return done ? 1 : 0;
      }

      case 'complete_hard': {
        const done = tasks.some(
          t => t.completed && t.completedDate === today &&
            (t.difficulty === 'Hard' || t.difficulty === 'hard')
        );
        return done ? 1 : 0;
      }

      case 'maintain_streak': {
        const streakDays = (state.stats && state.stats.streakDays) || 0;
        return streakDays >= 1 ? 1 : 0;
      }

      case 'complete_epic_subtask': {
        const epics = state.epics || [];
        const hasCompletedSubtask = epics.some(epic =>
          (epic.subtasks || []).some(
            st => st.completed && st.completedDate === today
          )
        );
        return hasCompletedSubtask ? 1 : 0;
      }

      default:
        return quest.progress;
    }
  }

  // ---------------------------------------------------------------------------
  // onTaskComplete hook
  // ---------------------------------------------------------------------------

  function onTaskComplete(task) {
    const state = window.APP.getState();

    ensureQuestsState(state);
    ensureBossState(state);

    // Update quest progress
    state.quests.list.forEach(quest => {
      if (quest.claimed) return;
      quest.progress = computeQuestProgress(quest, state);
    });

    // Deal damage to boss
    const boss = state.boss;
    if (!boss.defeated) {
      const dmg = randInt(5, 15);
      boss.hp = Math.max(0, boss.hp - dmg);
      if (boss.hp === 0) {
        boss.defeated = true;
      }
    }

    window.APP.touchState();
    window.APP.persist();
  }

  // ---------------------------------------------------------------------------
  // Rendering
  // ---------------------------------------------------------------------------

  function renderBoss(state) {
    const el = document.getElementById('boss-section');
    if (!el) return;

    const boss = state.boss;
    const hpPct = Math.round((boss.hp / boss.maxHp) * 100);
    const daysLeft = daysUntilMonday();

    if (boss.defeated) {
      el.innerHTML = `
        <div class="section-card">
          <div class="section-label">Weekly Boss</div>
          <div class="boss-card boss-defeated">
            <div class="boss-header">
              <span class="boss-emoji">🏆</span>
              <div>
                <div class="boss-title">${escHtml(boss.title)}</div>
                <div class="boss-subtitle">Boss defeated! New boss in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}.</div>
              </div>
            </div>
            ${!boss.rewardClaimed ? `
              <div class="hint-row">
                <button class="btn-primary" data-action="claim-boss-reward">Claim 200 XP Reward</button>
              </div>
            ` : '<div class="hint-row">Reward claimed. Well done, hero!</div>'}
          </div>
        </div>
      `;
    } else {
      el.innerHTML = `
        <div class="section-card">
          <div class="section-label">Weekly Boss</div>
          <div class="boss-card">
            <div class="boss-header">
              <span class="boss-emoji">👹</span>
              <div>
                <div class="boss-title">${escHtml(boss.title)}</div>
                <div class="boss-subtitle">Weekly Boss</div>
              </div>
            </div>
            <div class="boss-hp-bar">
              <div class="boss-hp-fill" style="width:${hpPct}%"></div>
            </div>
            <div class="boss-hp-label">${boss.hp} / ${boss.maxHp} HP</div>
            <div class="hint-row">Complete tasks to deal damage!</div>
          </div>
        </div>
      `;
    }
  }

  function renderQuests(state) {
    const el = document.getElementById('quests-list');
    if (!el) return;

    const quests = state.quests.list;

    if (!quests.length) {
      el.innerHTML = '<div class="hint-row">No quests available today.</div>';
      return;
    }

    el.innerHTML = quests.map(quest => {
      const pct = Math.min(100, Math.round((quest.progress / quest.target) * 100));
      const complete = quest.progress >= quest.target;
      const claimedClass = quest.claimed ? ' claimed' : '';

      return `
        <div class="quest-card${claimedClass}" data-quest-id="${escHtml(quest.id)}">
          <div class="quest-header">
            <span class="quest-icon">${quest.icon}</span>
            <span class="quest-title">${escHtml(quest.desc)}</span>
            <span class="quest-reward">+${quest.xpReward} XP</span>
          </div>
          <div class="quest-progress-bar">
            <div class="quest-progress-fill" style="width:${pct}%"></div>
          </div>
          <div class="quest-footer">
            <span class="quest-progress-text">${quest.progress} / ${quest.target}</span>
            ${complete && !quest.claimed
              ? `<button class="btn-primary" data-action="claim-quest" data-quest-id="${escHtml(quest.id)}">Claim</button>`
              : quest.claimed
                ? '<span class="btn-secondary">Claimed ✓</span>'
                : ''
            }
          </div>
        </div>
      `;
    }).join('');
  }

  function render() {
    const state = window.APP.getState();

    ensureQuestsState(state);
    ensureBossState(state);

    // Recompute progress on each render so it stays in sync
    state.quests.list.forEach(quest => {
      if (!quest.claimed) {
        quest.progress = computeQuestProgress(quest, state);
      }
    });

    renderBoss(state);
    renderQuests(state);
  }

  // ---------------------------------------------------------------------------
  // Event delegation
  // ---------------------------------------------------------------------------

  function escHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function handleClick(e) {
    const action = e.target.closest('[data-action]');
    if (!action) return;

    const state = window.APP.getState();

    switch (action.dataset.action) {
      case 'claim-quest': {
        const questId = action.dataset.questId;
        const quest = (state.quests && state.quests.list || []).find(q => q.id === questId);
        if (!quest || quest.claimed || quest.progress < quest.target) return;
        quest.claimed = true;
        window.APP.gainXP(quest.xpReward);
        window.APP.touchState();
        window.APP.persist();
        render();
        break;
      }

      case 'claim-boss-reward': {
        const boss = state.boss;
        if (!boss || !boss.defeated || boss.rewardClaimed) return;
        boss.rewardClaimed = true;
        window.APP.gainXP(200);
        window.APP.touchState();
        window.APP.persist();
        render();
        break;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------

  function init() {
    document.addEventListener('click', handleClick);

    const state = window.APP.getState();
    ensureQuestsState(state);
    ensureBossState(state);
    window.APP.touchState();
    window.APP.persist();
  }

  // ---------------------------------------------------------------------------
  // Register module
  // ---------------------------------------------------------------------------

  window.APP = window.APP || {};
  window.APP.modules = window.APP.modules || {};
  window.APP.renderHooks = window.APP.renderHooks || [];
  window.APP.taskCompleteHooks = window.APP.taskCompleteHooks || [];

  window.APP.modules.quests = { init, render };
  window.APP.renderHooks.push(render);
  window.APP.taskCompleteHooks.push(onTaskComplete);
})();
