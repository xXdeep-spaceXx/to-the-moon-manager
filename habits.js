(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function dateStrOffset(daysAgo) {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().slice(0, 10);
  }

  function calcStreak(habit) {
    let streak = 0;
    const today = todayStr();
    // Start from today and walk backward
    for (let i = 0; i < 3650; i++) {
      const day = dateStrOffset(i);
      if (habit.completedDates.includes(day)) {
        streak++;
      } else {
        // If today is not completed, streak starts from yesterday
        if (i === 0) {
          // Today not done — check from yesterday
          continue;
        }
        break;
      }
    }
    // If today is not done but yesterday starts a streak, we already handled it
    // Re-run properly: streak is consecutive days ending at the most recent completed day
    streak = 0;
    const todayDone = habit.completedDates.includes(today);
    const startOffset = todayDone ? 0 : 1;
    for (let i = startOffset; i < 3650; i++) {
      const day = dateStrOffset(i);
      if (habit.completedDates.includes(day)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }

  function generateId() {
    return "habit_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 7);
  }

  function ensureHabits(state) {
    if (!Array.isArray(state.habits)) {
      state.habits = [];
    }
  }

  // ---------------------------------------------------------------------------
  // Preset emoji options
  // ---------------------------------------------------------------------------

  const PRESET_EMOJIS = ["🏃", "💧", "📚", "🧘", "💪", "🥗", "😴", "✍️", "🎯", "💰", "🌿", "🧹", "🎨", "🎵", "🧠"];

  const CATEGORIES = [
    { value: "life",     label: "Life" },
    { value: "work",     label: "Work" },
    { value: "health",   label: "Health" },
    { value: "learning", label: "Learning" },
    { value: "finance",  label: "Finance" },
  ];

  // ---------------------------------------------------------------------------
  // Render: Add Habit Form  →  #habit-add-form
  // ---------------------------------------------------------------------------

  function renderAddForm() {
    const container = document.getElementById("habit-add-form");
    if (!container) return;

    const state = window.APP.getState();
    ensureHabits(state);

    // Keep track of selected emoji in a module-level variable so we can read it
    // from the submit handler without querying hidden inputs awkwardly.
    const formId = "habit-add-form-inner";

    container.innerHTML = `
      <div class="section-card">
        <div class="section-label">New Habit</div>
        <form id="${formId}" class="form-stack" autocomplete="off">

          <div class="input-row" style="flex-wrap:wrap;gap:6px;" id="emoji-picker-row">
            ${PRESET_EMOJIS.map((em, i) => `
              <button
                type="button"
                class="emoji-option${i === 0 ? " emoji-selected" : ""}"
                data-emoji="${em}"
                aria-label="${em}"
                style="font-size:1.5rem;background:none;border:2px solid ${i === 0 ? "var(--accent,#6c63ff)" : "transparent"};border-radius:8px;padding:2px 6px;cursor:pointer;transition:border-color .15s;"
              >${em}</button>
            `).join("")}
          </div>

          <div class="input-row">
            <input
              type="text"
              id="habit-name-input"
              placeholder="Habit name…"
              maxlength="60"
              required
              style="flex:1;"
            />
          </div>

          <div class="input-row">
            <select id="habit-category-select" style="flex:1;">
              ${CATEGORIES.map(c => `<option value="${c.value}">${c.label}</option>`).join("")}
            </select>
          </div>

          <div class="input-row">
            <button type="submit" class="btn-primary" style="width:100%;">Add Habit</button>
          </div>

        </form>
      </div>
    `;

    // Emoji picker selection
    let selectedEmoji = PRESET_EMOJIS[0];
    const pickerRow = container.querySelector("#emoji-picker-row");
    pickerRow.addEventListener("click", function (e) {
      const btn = e.target.closest(".emoji-option");
      if (!btn) return;
      selectedEmoji = btn.dataset.emoji;
      pickerRow.querySelectorAll(".emoji-option").forEach(b => {
        const active = b === btn;
        b.classList.toggle("emoji-selected", active);
        b.style.borderColor = active ? "var(--accent,#6c63ff)" : "transparent";
      });
    });

    // Form submit
    const form = container.querySelector(`#${formId}`);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      const nameInput = form.querySelector("#habit-name-input");
      const categorySelect = form.querySelector("#habit-category-select");
      const name = nameInput.value.trim();
      if (!name) return;

      const st = window.APP.getState();
      ensureHabits(st);

      st.habits.push({
        id: generateId(),
        name: name,
        emoji: selectedEmoji,
        category: categorySelect.value,
        completedDates: [],
        createdAt: new Date().toISOString(),
      });

      window.APP.touchState();
      window.APP.persist();

      // Reset form
      nameInput.value = "";
      categorySelect.value = CATEGORIES[0].value;

      // Re-render everything
      render();
    });
  }

  // ---------------------------------------------------------------------------
  // Render: Today's Habits  →  #habit-today
  // ---------------------------------------------------------------------------

  function renderToday() {
    const container = document.getElementById("habit-today");
    if (!container) return;

    const state = window.APP.getState();
    ensureHabits(state);
    const today = todayStr();

    if (state.habits.length === 0) {
      container.innerHTML = "";
      return;
    }

    const cardsHtml = state.habits.map(habit => {
      const doneToday = habit.completedDates.includes(today);
      const streak = calcStreak(habit);

      // 7-day dots: index 6 = 6 days ago, index 0 = today
      const dotsHtml = Array.from({ length: 7 }, (_, i) => {
        const dayOffset = 6 - i; // 6 days ago → today
        const dayStr = dateStrOffset(dayOffset);
        const done = habit.completedDates.includes(dayStr);
        const isToday = dayOffset === 0;
        let cls = "habit-dot";
        if (done) {
          cls += " done";
        } else if (isToday) {
          cls += " today-empty";
        }
        return `<span class="${cls}" title="${dayStr}"></span>`;
      }).join("");

      return `
        <div class="habit-card" data-id="${habit.id}">
          <div class="habit-emoji">${habit.emoji}</div>
          <div class="habit-info">
            <div class="habit-name">${escapeHtml(habit.name)}</div>
            <div class="habit-streak">${streak > 0 ? "🔥 " + streak + " day streak" : "No streak yet"}</div>
            <div class="habit-dots">${dotsHtml}</div>
          </div>
          <button
            class="habit-check-btn${doneToday ? " checked" : ""}"
            data-id="${habit.id}"
            aria-label="${doneToday ? "Uncheck habit" : "Check habit"}"
            title="${doneToday ? "Mark incomplete" : "Mark complete"}"
          >${doneToday ? "✓" : ""}</button>
        </div>
      `;
    }).join("");

    container.innerHTML = `
      <div class="section-card">
        <div class="section-label">Today's Habits</div>
        ${cardsHtml}
      </div>
    `;

    // Wire up check buttons
    container.querySelectorAll(".habit-check-btn").forEach(btn => {
      btn.addEventListener("click", function () {
        const id = this.dataset.id;
        const st = window.APP.getState();
        ensureHabits(st);
        const habit = st.habits.find(h => h.id === id);
        if (!habit) return;

        const t = todayStr();
        const idx = habit.completedDates.indexOf(t);
        if (idx === -1) {
          // Check: mark complete and award XP
          habit.completedDates.push(t);
          window.APP.gainXP(15);
        } else {
          // Uncheck: remove today (no XP deduction)
          habit.completedDates.splice(idx, 1);
        }

        window.APP.touchState();
        window.APP.persist();
        render();
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Render: Habit History Grid  →  #habit-history
  // ---------------------------------------------------------------------------

  function renderHistory() {
    const container = document.getElementById("habit-history");
    if (!container) return;

    const state = window.APP.getState();
    ensureHabits(state);

    if (state.habits.length === 0) {
      container.innerHTML = `
        <div class="section-card">
          <div class="section-label">All Habits</div>
          <div class="hint-row">Add your first habit above.</div>
        </div>
      `;
      return;
    }

    // Build a grid: rows = habits, columns = last 7 days (oldest → newest)
    const days = Array.from({ length: 7 }, (_, i) => dateStrOffset(6 - i));

    const gridHtml = state.habits.map(habit => {
      const streak = calcStreak(habit);
      const dotsHtml = days.map(day => {
        const done = habit.completedDates.includes(day);
        const isToday = day === todayStr();
        let cls = "habit-dot";
        if (done) {
          cls += " done";
        } else if (isToday) {
          cls += " today-empty";
        }
        return `<span class="${cls}" title="${day}"></span>`;
      }).join("");

      return `
        <div class="habit-card" style="margin-bottom:6px;">
          <div class="habit-emoji" style="font-size:1.4rem;">${habit.emoji}</div>
          <div class="habit-info">
            <div class="habit-name">${escapeHtml(habit.name)}
              <span style="font-size:0.75rem;opacity:0.6;margin-left:6px;">${habit.category}</span>
            </div>
            <div class="habit-streak">${streak > 0 ? "🔥 " + streak + " day streak" : "No streak yet"}</div>
            <div class="habit-dots">${dotsHtml}</div>
          </div>
          <button
            class="btn-secondary habit-delete-btn"
            data-id="${habit.id}"
            title="Remove habit"
            style="font-size:0.8rem;padding:4px 8px;align-self:center;"
          >✕</button>
        </div>
      `;
    }).join("");

    container.innerHTML = `
      <div class="section-card">
        <div class="section-label">All Habits</div>
        <div class="habit-grid">${gridHtml}</div>
      </div>
    `;

    // Wire up delete buttons
    container.querySelectorAll(".habit-delete-btn").forEach(btn => {
      btn.addEventListener("click", function () {
        const id = this.dataset.id;
        const st = window.APP.getState();
        ensureHabits(st);
        const idx = st.habits.findIndex(h => h.id === id);
        if (idx !== -1) {
          st.habits.splice(idx, 1);
          window.APP.touchState();
          window.APP.persist();
          render();
        }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // Utility
  // ---------------------------------------------------------------------------

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // ---------------------------------------------------------------------------
  // Init & Render
  // ---------------------------------------------------------------------------

  function init() {
    const state = window.APP.getState();
    ensureHabits(state);
    render();
  }

  function render() {
    renderAddForm();
    renderToday();
    renderHistory();
  }

  // ---------------------------------------------------------------------------
  // Register module
  // ---------------------------------------------------------------------------

  window.APP = window.APP || {};
  window.APP.modules = window.APP.modules || {};
  window.APP.renderHooks = window.APP.renderHooks || [];

  window.APP.modules.habits = { init, render };
  window.APP.renderHooks.push(render);

})();
