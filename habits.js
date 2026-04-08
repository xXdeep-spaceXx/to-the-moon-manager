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
    const today = todayStr();

    if (habit.negative) {
      // For negative habits: streak = consecutive days avoided (NOT logged)
      // Cap lookback at creation date so a brand-new habit doesn't show an inflated streak
      const createdDay = habit.createdAt ? habit.createdAt.slice(0, 10) : today;
      let streak = 0;
      for (let i = 0; i < 3650; i++) {
        const day = dateStrOffset(i);
        if (day < createdDay) break; // don't count days before habit existed
        if (!habit.completedDates.includes(day)) {
          streak++;
        } else {
          // Logged on this day — streak resets
          if (i === 0) return 0; // logged today → 0
          break;
        }
      }
      return streak;
    }

    // Positive habit: streak = consecutive days completed
    let streak = 0;
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

          <div class="input-row" style="align-items:center;gap:10px;">
            <label class="habit-negative-toggle" style="display:flex;align-items:center;gap:8px;cursor:pointer;user-select:none;font-size:13px;color:var(--text-2);">
              <input type="checkbox" id="habit-negative-check" style="width:16px;height:16px;accent-color:var(--pink);cursor:pointer;" />
              <span>Bad habit <span style="opacity:0.6;">(costs XP)</span></span>
            </label>
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
      const negativeCheck = form.querySelector("#habit-negative-check");
      const name = nameInput.value.trim();
      if (!name) return;

      const st = window.APP.getState();
      ensureHabits(st);

      st.habits.push({
        id: generateId(),
        name: name,
        emoji: selectedEmoji,
        category: categorySelect.value,
        negative: negativeCheck ? negativeCheck.checked : false,
        completedDates: [],
        createdAt: new Date().toISOString(),
      });

      window.APP.touchState();
      window.APP.persist();

      // Reset form
      nameInput.value = "";
      categorySelect.value = CATEGORIES[0].value;
      if (negativeCheck) negativeCheck.checked = false;

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
      const isNegative = !!habit.negative;
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
          cls += isNegative ? " done-negative" : " done";
        } else if (isToday) {
          cls += " today-empty";
        }
        return `<span class="${cls}" title="${dayStr}"></span>`;
      }).join("");

      // Streak display
      let streakHtml;
      if (isNegative) {
        streakHtml = streak > 0
          ? "🛡️ " + streak + " day" + (streak === 1 ? "" : "s") + " avoided"
          : "☠️ Logged today — stay strong!";
      } else {
        streakHtml = streak > 0 ? "🔥 " + streak + " day streak" : "No streak yet";
      }

      const cardExtraClass = isNegative ? " habit-card--negative" : (doneToday ? " done-today" : "");
      const checkBtnClass = isNegative
        ? "habit-check-btn habit-check-btn--negative" + (doneToday ? " checked-negative" : "")
        : "habit-check-btn" + (doneToday ? " checked" : "");
      const checkLabel = isNegative
        ? (doneToday ? "Unlog bad habit" : "Log bad habit")
        : (doneToday ? "Uncheck habit" : "Check habit");
      const checkTitle = isNegative
        ? (doneToday ? "Undo log (restore XP)" : "Log bad habit (-15 XP)")
        : (doneToday ? "Mark incomplete" : "Mark complete");
      const checkInner = doneToday ? "✓" : (isNegative ? "💀" : "");
      const namePrefix = isNegative ? "⚠️ " : "";

      return `
        <div class="habit-card${cardExtraClass}" data-id="${habit.id}">
          <div class="habit-emoji">${habit.emoji}</div>
          <div class="habit-info">
            <div class="habit-name">${namePrefix}${escapeHtml(habit.name)}</div>
            <div class="habit-streak">${streakHtml}</div>
            <div class="habit-dots">${dotsHtml}</div>
          </div>
          <button
            class="${checkBtnClass}"
            data-id="${habit.id}"
            aria-label="${checkLabel}"
            title="${checkTitle}"
          >${checkInner}</button>
          <button
            class="habit-delete-btn"
            data-id="${habit.id}"
            data-name="${escapeHtml(habit.name)}"
            aria-label="Delete habit"
            title="Delete habit"
          >×</button>
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

        const isNegative = !!habit.negative;
        const t = todayStr();
        const idx = habit.completedDates.indexOf(t);

        if (isNegative) {
          if (idx === -1) {
            // Log bad habit: mark as done today and deduct XP
            habit.completedDates.push(t);
            window.APP.gainXP(-15);
            showHabitXPToast(habit, -15);
          } else {
            // Undo log: remove today and restore XP
            habit.completedDates.splice(idx, 1);
            window.APP.gainXP(15);
          }
        } else {
          if (idx === -1) {
            // Check: mark complete and award XP
            habit.completedDates.push(t);
            window.APP.gainXP(15);
            showHabitXPToast(habit, 15);
            if (window.APP.checkChallenges) window.APP.checkChallenges();
          } else {
            // Uncheck: remove today (no XP deduction)
            habit.completedDates.splice(idx, 1);
          }
        }

        window.APP.touchState();
        window.APP.persist();
        render();
      });
    });

    // Wire up delete buttons
    container.querySelectorAll(".habit-delete-btn").forEach(btn => {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const id = this.dataset.id;
        const name = this.dataset.name;
        if (!confirm("Delete habit '" + name + "'? This cannot be undone.")) return;
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
  // Render: Habit Heatmap  →  #habit-heatmap
  // ---------------------------------------------------------------------------

  function renderHeatmap() {
    const container = document.getElementById("habit-heatmap");
    if (!container) return;

    const state = window.APP.getState();
    ensureHabits(state);

    if (state.habits.length === 0) {
      container.innerHTML = "";
      return;
    }

    // Build a map of date → count of habits completed that day
    const DAYS = 112; // 16 weeks
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Collect all dates we care about
    const countMap = {};
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      countMap[d.toISOString().slice(0, 10)] = 0;
    }

    // Count completions per day
    state.habits.forEach(habit => {
      if (!Array.isArray(habit.completedDates)) return;
      habit.completedDates.forEach(dateStr => {
        if (dateStr in countMap) {
          countMap[dateStr]++;
        }
      });
    });

    // Build an ordered array of { dateStr, count } from oldest to newest
    const cells = Object.keys(countMap).sort().map(dateStr => ({
      dateStr,
      count: countMap[dateStr],
    }));

    // Pad so the first cell falls on a Monday
    // cells[0] is the oldest day; find its weekday (0=Sun…6=Sat), shift to Mon=0
    const firstDate = new Date(cells[0].dateStr + "T00:00:00");
    const firstDow = (firstDate.getDay() + 6) % 7; // Mon=0 … Sun=6
    const leadingPad = firstDow; // number of empty cells to prepend

    // Build columns: each column is 7 cells (Mon–Sun), left=oldest, right=newest
    const totalCells = leadingPad + cells.length;
    const numCols = Math.ceil(totalCells / 7);

    // Pre-compute month label positions (which column each month starts in)
    const monthLabels = []; // { col, label }
    let lastMonth = null;
    cells.forEach((cell, idx) => {
      const col = Math.floor((leadingPad + idx) / 7);
      const month = cell.dateStr.slice(0, 7); // YYYY-MM
      if (month !== lastMonth) {
        lastMonth = month;
        const date = new Date(cell.dateStr + "T00:00:00");
        monthLabels.push({
          col,
          label: date.toLocaleString("default", { month: "short" }),
        });
      }
    });

    // Build the DOM as an HTML string
    // Layout: a wrapper with day-labels on the left + columns grid on the right
    const DAY_LABELS = ["M", "", "W", "", "F", "", ""];

    // Month label row
    const monthLabelCells = Array.from({ length: numCols }, (_, col) => {
      const ml = monthLabels.find(m => m.col === col);
      return `<div class="heatmap-month-label">${ml ? ml.label : ""}</div>`;
    }).join("");

    // Grid columns
    const columnDivs = Array.from({ length: numCols }, (_, col) => {
      const rowDivs = Array.from({ length: 7 }, (_, row) => {
        const cellIndex = col * 7 + row - leadingPad;
        if (cellIndex < 0 || cellIndex >= cells.length) {
          return `<div class="heatmap-cell heatmap-cell--empty"></div>`;
        }
        const { dateStr, count } = cells[cellIndex];
        const level = count === 0 ? 0 : count === 1 ? 1 : count === 2 ? 2 : 3;
        const label = count === 0
          ? `${dateStr}: no habits completed`
          : `${dateStr}: ${count} habit${count === 1 ? "" : "s"} completed`;
        return `<div class="heatmap-cell heatmap-cell--${level}" title="${label}"></div>`;
      }).join("");
      return `<div class="heatmap-col">${rowDivs}</div>`;
    }).join("");

    const dayLabelDivs = DAY_LABELS.map(l =>
      `<div class="heatmap-day-label">${l}</div>`
    ).join("");

    container.innerHTML = `
      <div class="section-card">
        <div class="section-label">16-Week Activity</div>
        <div class="habit-heatmap">
          <div class="heatmap-day-labels">${dayLabelDivs}</div>
          <div class="heatmap-body">
            <div class="heatmap-months">${monthLabelCells}</div>
            <div class="heatmap-grid">${columnDivs}</div>
          </div>
        </div>
      </div>
    `;
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
      const isNegative = !!habit.negative;
      const streak = calcStreak(habit);
      const dotsHtml = days.map(day => {
        const done = habit.completedDates.includes(day);
        const isToday = day === todayStr();
        let cls = "habit-dot";
        if (done) {
          cls += isNegative ? " done-negative" : " done";
        } else if (isToday) {
          cls += " today-empty";
        }
        return `<span class="${cls}" title="${day}"></span>`;
      }).join("");

      let streakHtml;
      if (isNegative) {
        streakHtml = streak > 0
          ? "🛡️ " + streak + " day" + (streak === 1 ? "" : "s") + " avoided"
          : "☠️ Logged recently";
      } else {
        streakHtml = streak > 0 ? "🔥 " + streak + " day streak" : "No streak yet";
      }

      const cardExtraClass = isNegative ? " habit-card--negative" : "";
      const namePrefix = isNegative ? "⚠️ " : "";

      return `
        <div class="habit-card${cardExtraClass}" style="margin-bottom:6px;">
          <div class="habit-emoji" style="font-size:1.4rem;">${habit.emoji}</div>
          <div class="habit-info">
            <div class="habit-name">${namePrefix}${escapeHtml(habit.name)}
              <span style="font-size:0.75rem;opacity:0.6;margin-left:6px;">${habit.category}</span>
            </div>
            <div class="habit-streak">${streakHtml}</div>
            <div class="habit-dots">${dotsHtml}</div>
          </div>
          <button
            class="habit-delete-btn"
            data-id="${habit.id}"
            data-name="${escapeHtml(habit.name)}"
            aria-label="Delete habit"
            title="Delete habit"
          >×</button>
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
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        const id = this.dataset.id;
        const name = this.dataset.name;
        if (!confirm("Delete habit '" + name + "'? This cannot be undone.")) return;
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

  function showHabitXPToast(habit, xpDelta) {
    const isNegative = xpDelta < 0;
    const label = isNegative
      ? "💸 " + escapeHtml(habit.category) + " -" + Math.abs(xpDelta) + " XP"
      : "✨ " + escapeHtml(habit.category) + " +" + xpDelta + " XP";

    const toast = document.createElement("div");
    toast.className = "habit-xp-toast" + (isNegative ? " habit-xp-toast--negative" : " habit-xp-toast--positive");
    toast.innerHTML = label;
    document.body.appendChild(toast);

    // Trigger animation on next frame
    requestAnimationFrame(() => {
      toast.classList.add("habit-xp-toast--visible");
    });

    setTimeout(() => {
      toast.classList.remove("habit-xp-toast--visible");
      setTimeout(() => { if (toast.parentNode) toast.parentNode.removeChild(toast); }, 400);
    }, 2000);
  }

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
    renderHeatmap();
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
