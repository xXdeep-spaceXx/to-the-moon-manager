(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  var CATEGORY_COLOR = {
    health:   "#ff375f",
    work:     "#0a84ff",
    learning: "#bf5af2",
    finance:  "#ff9f0a",
    life:     "#30d158",
  };

  var CATEGORY_EMOJI = {
    health:   "❤️",
    work:     "💼",
    learning: "📚",
    finance:  "💰",
    life:     "🌱",
  };

  var MONTH_NAMES = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  var DAY_LABELS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  // ---------------------------------------------------------------------------
  // Module state
  // ---------------------------------------------------------------------------

  var viewYear  = null;
  var viewMonth = null; // 0-indexed
  var activePopover = null;

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function todayKey() {
    var d = new Date();
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  function dateKey(year, month, day) {
    return year + "-" +
      String(month + 1).padStart(2, "0") + "-" +
      String(day).padStart(2, "0");
  }

  function isOverdue(dueDate) {
    return dueDate && dueDate < todayKey();
  }

  function getActiveTasks() {
    var state = window.APP.getState();
    if (!state || !Array.isArray(state.tasks)) return [];
    return state.tasks.filter(function (t) {
      return t.status !== "completed";
    });
  }

  // Build a map: dateKey -> [task, ...]
  function buildDayMap(tasks) {
    var map = {};
    tasks.forEach(function (t) {
      if (t.dueDate) {
        if (!map[t.dueDate]) map[t.dueDate] = [];
        map[t.dueDate].push(t);
      }
    });
    return map;
  }

  function getUndatedTasks(tasks) {
    return tasks.filter(function (t) { return !t.dueDate; });
  }

  // ---------------------------------------------------------------------------
  // Popover
  // ---------------------------------------------------------------------------

  function closePopover() {
    if (activePopover) {
      activePopover.remove();
      activePopover = null;
    }
  }

  function openPopover(anchorEl, dayTasks, key) {
    closePopover();

    var pop = document.createElement("div");
    pop.className = "cal-popover";

    var header = document.createElement("div");
    header.className = "cal-popover-header";

    var parts = key.split("-");
    var d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    header.textContent = d.toLocaleDateString(undefined, { weekday:"short", month:"short", day:"numeric" });

    var closeBtn = document.createElement("button");
    closeBtn.className = "cal-popover-close";
    closeBtn.innerHTML = "&#x2715;";
    closeBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      closePopover();
    });
    header.appendChild(closeBtn);
    pop.appendChild(header);

    if (dayTasks.length === 0) {
      var empty = document.createElement("p");
      empty.className = "cal-popover-empty";
      empty.textContent = "No tasks due.";
      pop.appendChild(empty);
    } else {
      var list = document.createElement("ul");
      list.className = "cal-popover-list";
      dayTasks.forEach(function (t) {
        var li = document.createElement("li");
        li.className = "cal-popover-item";

        var color = isOverdue(t.dueDate) ? "#ff375f" : (CATEGORY_COLOR[t.category] || "#7c3aed");

        var dot = document.createElement("span");
        dot.className = "cal-popover-dot";
        dot.style.background = color;

        var label = document.createElement("span");
        label.className = "cal-popover-label";
        label.textContent = t.text;
        if (t.status === "completed") label.style.opacity = "0.45";

        var btn = document.createElement("button");
        btn.className = "cal-popover-complete";
        btn.title = "Complete mission";
        btn.innerHTML = "&#10003;";
        btn.dataset.taskId = t.id;
        btn.addEventListener("click", function (e) {
          e.stopPropagation();
          if (typeof completeTask === "function") {
            completeTask(t.id);
          } else if (window.APP && window.APP.completeTask) {
            window.APP.completeTask(t.id);
          }
          closePopover();
          render();
        });

        li.appendChild(dot);
        li.appendChild(label);
        li.appendChild(btn);
        list.appendChild(li);
      });
      pop.appendChild(list);
    }

    // Quick Add
    var addWrap = document.createElement("div");
    addWrap.className = "cal-popover-add";
    var addInput = document.createElement("input");
    addInput.type = "text";
    addInput.placeholder = "Add mission...";
    var addBtn = document.createElement("button");
    addBtn.className = "btn-primary";
    addBtn.style.padding = "0 8px";
    addBtn.innerHTML = "Add";

    function handleAdd() {
        var text = addInput.value.trim();
        if (!text) return;
        var state = window.APP.getState();
        if (!state) return;
        var task = {
            id: 'task_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
            text: text,
            category: 'life', // Default
            difficulty: 'easy',
            priority: 'medium',
            status: 'active',
            createdAt: new Date().toISOString(),
            completedAt: null,
            xpValue: 10,
            dueDate: key,
            recur: 'none',
            estimateMins: null
        };
        state.tasks.push(task);
        if (typeof window.APP.touchState === 'function') window.APP.touchState();
        if (typeof window.APP.persistAndRender === 'function') window.APP.persistAndRender();
        closePopover();
    }

    addBtn.addEventListener("click", handleAdd);
    addInput.addEventListener("keydown", function(e) {
        if (e.key === "Enter") handleAdd();
    });

    addWrap.appendChild(addInput);
    addWrap.appendChild(addBtn);
    pop.appendChild(addWrap);

    // Position relative to the anchor cell
    var rect = anchorEl.getBoundingClientRect();
    var calRect = document.getElementById("page-calendar").getBoundingClientRect();

    pop.style.position = "absolute";

    // Default: below cell
    var top  = (rect.bottom - calRect.top) + 6;
    var left = (rect.left   - calRect.left);

    pop.style.top  = top  + "px";
    pop.style.left = left + "px";

    document.getElementById("page-calendar").appendChild(pop);
    activePopover = pop;

    // After insertion, clamp right edge
    var popW = pop.offsetWidth;
    var calW = document.getElementById("page-calendar").offsetWidth;
    if (left + popW > calW - 8) {
      pop.style.left = Math.max(0, calW - popW - 8) + "px";
    }

    // If pops below viewport, show above instead
    var popH   = pop.offsetHeight;
    var popTop = rect.bottom + 6;
    if (popTop + popH > window.innerHeight) {
      top = (rect.top - calRect.top) - popH - 6;
      if (top < 0) top = 4;
      pop.style.top = top + "px";
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  function render() {
    var container = document.getElementById("cal-container");
    if (!container) return;

    // Default to current month
    var now = new Date();
    if (viewYear === null)  viewYear  = now.getFullYear();
    if (viewMonth === null) viewMonth = now.getMonth();

    var tasks   = getActiveTasks();
    var dayMap  = buildDayMap(tasks);
    var undated = getUndatedTasks(tasks);
    var today   = todayKey();

    container.innerHTML = "";

    // ── Header ──────────────────────────────────────────────────────────────
    var header = document.createElement("div");
    header.className = "cal-header";

    var prevBtn = document.createElement("button");
    prevBtn.className = "cal-nav-btn";
    prevBtn.setAttribute("aria-label", "Previous month");
    prevBtn.innerHTML = "&#8592;";
    prevBtn.addEventListener("click", function () {
      viewMonth--;
      if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      closePopover();
      render();
    });

    var nextBtn = document.createElement("button");
    nextBtn.className = "cal-nav-btn";
    nextBtn.setAttribute("aria-label", "Next month");
    nextBtn.innerHTML = "&#8594;";
    nextBtn.addEventListener("click", function () {
      viewMonth++;
      if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      closePopover();
      render();
    });

    var monthTitle = document.createElement("span");
    monthTitle.className = "cal-month-title";
    monthTitle.textContent = MONTH_NAMES[viewMonth] + " " + viewYear;

    var todayBtn = document.createElement("button");
    todayBtn.className = "cal-today-btn";
    todayBtn.textContent = "Today";
    todayBtn.addEventListener("click", function () {
      var n = new Date();
      viewYear  = n.getFullYear();
      viewMonth = n.getMonth();
      closePopover();
      render();
    });

    header.appendChild(prevBtn);
    header.appendChild(monthTitle);
    header.appendChild(nextBtn);
    header.appendChild(todayBtn);
    container.appendChild(header);

    // ── Main layout: grid + undated sidebar ─────────────────────────────────
    var layout = document.createElement("div");
    layout.className = "cal-layout";

    // ── Grid ────────────────────────────────────────────────────────────────
    var gridWrap = document.createElement("div");
    gridWrap.className = "cal-grid-wrap";

    // Day-of-week labels
    var labelsRow = document.createElement("div");
    labelsRow.className = "cal-day-labels";
    DAY_LABELS.forEach(function (lbl) {
      var cell = document.createElement("div");
      cell.className = "cal-day-label";
      cell.textContent = lbl;
      labelsRow.appendChild(cell);
    });
    gridWrap.appendChild(labelsRow);

    // Grid cells
    var grid = document.createElement("div");
    grid.className = "cal-grid";

    var firstDay = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    // Blank cells before the 1st
    for (var b = 0; b < firstDay; b++) {
      var blank = document.createElement("div");
      blank.className = "cal-cell cal-cell--blank";
      grid.appendChild(blank);
    }

    // Day cells
    for (var day = 1; day <= daysInMonth; day++) {
      var key    = dateKey(viewYear, viewMonth, day);
      var isToday = key === today;
      var dayTasks = dayMap[key] || [];

      var cell = document.createElement("div");
      cell.className = "cal-cell" + (isToday ? " cal-cell--today" : "");
      cell.setAttribute("data-date", key);

      var numEl = document.createElement("span");
      numEl.className = "cal-cell-num";
      numEl.textContent = day;
      cell.appendChild(numEl);

      // Task chips (max 3 shown, rest as +N)
      if (dayTasks.length > 0) {
        var chipsWrap = document.createElement("div");
        chipsWrap.className = "cal-chips";
        var shown = Math.min(dayTasks.length, 3);
        for (var i = 0; i < shown; i++) {
          var t = dayTasks[i];
          var chip = document.createElement("div");
          chip.className = "cal-chip";
          var chipColor = isOverdue(t.dueDate) ? "#ff375f" : (CATEGORY_COLOR[t.category] || "#7c3aed");
          chip.style.setProperty("--chip-color", chipColor);
          chip.textContent = t.text.length > 18 ? t.text.slice(0, 16) + "…" : t.text;
          chipsWrap.appendChild(chip);
        }
        if (dayTasks.length > 3) {
          var more = document.createElement("div");
          more.className = "cal-chip cal-chip--more";
          more.textContent = "+" + (dayTasks.length - 3) + " more";
          chipsWrap.appendChild(more);
        }
        cell.appendChild(chipsWrap);
      }

      // Click -> popover
      (function (cellEl, taskList, dKey) {
        cellEl.addEventListener("click", function (e) {
          e.stopPropagation();
          if (activePopover && activePopover.dataset.forDate === dKey) {
            closePopover();
            return;
          }
          var pop = openPopover(cellEl, taskList, dKey);
          if (activePopover) activePopover.dataset.forDate = dKey;
        });
      })(cell, dayTasks, key);

      grid.appendChild(cell);
    }

    gridWrap.appendChild(grid);
    layout.appendChild(gridWrap);

    // ── Undated sidebar ──────────────────────────────────────────────────────
    var sidebar = document.createElement("aside");
    sidebar.className = "cal-undated";

    var sideTitle = document.createElement("div");
    sideTitle.className = "cal-undated-title";
    sideTitle.textContent = "Undated";
    sidebar.appendChild(sideTitle);

    if (undated.length === 0) {
      var none = document.createElement("p");
      none.className = "cal-undated-empty";
      none.textContent = "No undated missions.";
      sidebar.appendChild(none);
    } else {
      var undatedList = document.createElement("ul");
      undatedList.className = "cal-undated-list";
      undated.forEach(function (t) {
        var li = document.createElement("li");
        li.className = "cal-undated-item";

        var color = CATEGORY_COLOR[t.category] || "#7c3aed";

        var dot = document.createElement("span");
        dot.className = "cal-undated-dot";
        dot.style.background = color;

        var emoji = document.createElement("span");
        emoji.className = "cal-undated-emoji";
        emoji.textContent = CATEGORY_EMOJI[t.category] || "📌";

        var text = document.createElement("span");
        text.className = "cal-undated-text";
        text.textContent = t.text;

        var completeBtn = document.createElement("button");
        completeBtn.className = "cal-undated-complete";
        completeBtn.title = "Complete mission";
        completeBtn.innerHTML = "&#10003;";
        completeBtn.dataset.taskId = t.id;
        completeBtn.addEventListener("click", function () {
          if (typeof completeTask === "function") {
            completeTask(t.id);
          } else if (window.APP && window.APP.completeTask) {
            window.APP.completeTask(t.id);
          }
          render();
        });

        li.appendChild(dot);
        li.appendChild(emoji);
        li.appendChild(text);
        li.appendChild(completeBtn);
        undatedList.appendChild(li);
      });
      sidebar.appendChild(undatedList);
    }

    layout.appendChild(sidebar);
    container.appendChild(layout);
  }

  // ---------------------------------------------------------------------------
  // Close popover on outside click
  // ---------------------------------------------------------------------------

  document.addEventListener("click", function (e) {
    if (activePopover && !activePopover.contains(e.target)) {
      closePopover();
    }
  });

  // ---------------------------------------------------------------------------
  // Bootstrap
  // ---------------------------------------------------------------------------

  window.APP = window.APP || {};
  window.APP.modules       = window.APP.modules       || {};
  window.APP.renderHooks   = window.APP.renderHooks   || [];

  window.APP.modules.calendar = { init: render, render: render };
  window.APP.renderCalendar   = render;

  // Re-render whenever state is persisted
  window.APP.renderHooks.push(function () {
    if (document.getElementById("page-calendar") &&
        !document.getElementById("page-calendar").classList.contains("hidden")) {
      render();
    }
  });

}());
