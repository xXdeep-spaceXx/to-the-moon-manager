(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  var CATEGORY_META = {
    health:   { label: "Health",   emoji: "❤️",  color: "#ff375f" },
    work:     { label: "Work",     emoji: "💼",  color: "#0a84ff" },
    learning: { label: "Learning", emoji: "📚",  color: "#bf5af2" },
    finance:  { label: "Finance",  emoji: "💰",  color: "#ff9f0a" },
    life:     { label: "Life",     emoji: "🌱",  color: "#30d158" },
  };

  var ACCENT_COLOR   = "#7c3aed";
  var ACCENT2_COLOR  = "#0a84ff";
  var GRID_COLOR     = "rgba(255,255,255,0.05)";
  var AXIS_COLOR     = "rgba(255,255,255,0.18)";
  var TEXT_COLOR     = "rgba(240,240,245,0.55)";
  var TEXT_BRIGHT    = "rgba(240,240,245,0.85)";
  var BG_COLOR       = "#0b0b13";

  var CHART_PAD = { top: 28, right: 24, bottom: 46, left: 52 };

  // ---------------------------------------------------------------------------
  // Date helpers
  // ---------------------------------------------------------------------------

  function dateKey(ts) {
    var d = new Date(ts);
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  }

  function last30Days() {
    var days = [];
    var now = new Date();
    for (var i = 29; i >= 0; i--) {
      var d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push(dateKey(d.getTime()));
    }
    return days;
  }

  function shortLabel(isoDate) {
    var parts = isoDate.split("-");
    var d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return months[d.getMonth()] + " " + d.getDate();
  }

  // ---------------------------------------------------------------------------
  // Data aggregation
  // ---------------------------------------------------------------------------

  function buildDailyData(tasks, days) {
    var xpByDay   = {};
    var cntByDay  = {};
    days.forEach(function (d) { xpByDay[d] = 0; cntByDay[d] = 0; });

    tasks.forEach(function (t) {
      if (t.status !== "completed" || !t.completedAt) return;
      var key = dateKey(t.completedAt);
      if (xpByDay.hasOwnProperty(key)) {
        xpByDay[key]  += (typeof t.xpValue === "number" ? t.xpValue : 20);
        cntByDay[key] += 1;
      }
    });

    return { xpByDay: xpByDay, cntByDay: cntByDay };
  }

  function buildCategoryData(tasks) {
    var counts = {};
    tasks.forEach(function (t) {
      if (t.status !== "completed") return;
      var cat = t.category || "life";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }

  // ---------------------------------------------------------------------------
  // Canvas helpers
  // ---------------------------------------------------------------------------

  // Polyfill-safe rounded rectangle path (does not call fill/stroke itself)
  function drawRoundRect(ctx, x, y, w, h, r) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y,         x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h,     x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x,     y + h,     x, y + h - r);
    ctx.lineTo(x,     y + r);
    ctx.quadraticCurveTo(x,     y,         x + r, y);
    ctx.closePath();
  }

  function clearCanvas(ctx, W, H) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, W, H);
  }

  function drawChartGrid(ctx, W, H, pad, maxVal, steps) {
    ctx.save();
    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    var chartH = H - pad.top - pad.bottom;
    var chartW = W - pad.left - pad.right;

    for (var i = 0; i <= steps; i++) {
      var y = pad.top + chartH - (i / steps) * chartH;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + chartW, y);
      ctx.stroke();

      // Y-axis label
      var val = Math.round((i / steps) * maxVal);
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = "11px -apple-system, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(val, pad.left - 8, y);
    }

    // Bottom axis line
    ctx.strokeStyle = AXIS_COLOR;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad.left, H - pad.bottom);
    ctx.lineTo(pad.left + chartW, H - pad.bottom);
    ctx.stroke();

    // Left axis line
    ctx.beginPath();
    ctx.moveTo(pad.left, pad.top);
    ctx.lineTo(pad.left, H - pad.bottom);
    ctx.stroke();

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Chart 1 — XP per day
  // ---------------------------------------------------------------------------

  function renderXPChart(canvas, tasks) {
    var W = canvas.width;
    var H = canvas.height;
    var ctx = canvas.getContext("2d");
    clearCanvas(ctx, W, H);

    var days = last30Days();
    var data = buildDailyData(tasks, days);
    var values = days.map(function (d) { return data.xpByDay[d]; });
    var maxVal = Math.max.apply(null, values.concat([20]));
    // Round up to neat ceiling
    var steps = 4;
    var niceCeil = Math.ceil(maxVal / steps) * steps;

    drawChartGrid(ctx, W, H, CHART_PAD, niceCeil, steps);

    var chartH = H - CHART_PAD.top - CHART_PAD.bottom;
    var chartW = W - CHART_PAD.left - CHART_PAD.right;
    var barW = Math.max(2, Math.floor(chartW / days.length) - 3);

    ctx.save();
    days.forEach(function (d, i) {
      var val  = data.xpByDay[d];
      var barH = niceCeil > 0 ? (val / niceCeil) * chartH : 0;
      var x    = CHART_PAD.left + (i / days.length) * chartW + (chartW / days.length - barW) / 2;
      var y     = CHART_PAD.top + chartH - barH;

      // Bar gradient
      var grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, "rgba(124,58,237,0.90)");
      grad.addColorStop(1, "rgba(124,58,237,0.25)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      if (barH > 3) {
        var r2 = Math.min(3, barW / 2);
        ctx.moveTo(x + r2, y);
        ctx.lineTo(x + barW - r2, y);
        ctx.quadraticCurveTo(x + barW, y, x + barW, y + r2);
        ctx.lineTo(x + barW, y + barH);
        ctx.lineTo(x, y + barH);
        ctx.lineTo(x, y + r2);
        ctx.quadraticCurveTo(x, y, x + r2, y);
      } else {
        ctx.rect(x, y, barW, Math.max(barH, 1));
      }
      ctx.fill();

      // X-axis label — every 5th bar
      if (i % 5 === 0 || i === days.length - 1) {
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = "10px -apple-system, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(shortLabel(d), x + barW / 2, H - CHART_PAD.bottom + 8);
      }
    });
    ctx.restore();

    // Title
    ctx.fillStyle = TEXT_BRIGHT;
    ctx.font = "600 13px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("XP Earned — Last 30 Days", CHART_PAD.left, 8);
  }

  // ---------------------------------------------------------------------------
  // Chart 2 — Completions per day
  // ---------------------------------------------------------------------------

  function renderCompletionsChart(canvas, tasks) {
    var W = canvas.width;
    var H = canvas.height;
    var ctx = canvas.getContext("2d");
    clearCanvas(ctx, W, H);

    var days   = last30Days();
    var data   = buildDailyData(tasks, days);
    var values = days.map(function (d) { return data.cntByDay[d]; });
    var maxVal = Math.max.apply(null, values.concat([5]));
    var steps  = Math.min(maxVal, 5);
    var niceCeil = Math.ceil(maxVal / steps) * steps;

    drawChartGrid(ctx, W, H, CHART_PAD, niceCeil, steps);

    var chartH = H - CHART_PAD.top - CHART_PAD.bottom;
    var chartW = W - CHART_PAD.left - CHART_PAD.right;
    var barW   = Math.max(2, Math.floor(chartW / days.length) - 3);

    ctx.save();
    days.forEach(function (d, i) {
      var val  = data.cntByDay[d];
      var barH = niceCeil > 0 ? (val / niceCeil) * chartH : 0;
      var x    = CHART_PAD.left + (i / days.length) * chartW + (chartW / days.length - barW) / 2;
      var y    = CHART_PAD.top + chartH - barH;

      var grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, "rgba(10,132,255,0.90)");
      grad.addColorStop(1, "rgba(10,132,255,0.20)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      if (barH > 3) {
        var r2 = Math.min(3, barW / 2);
        ctx.moveTo(x + r2, y);
        ctx.lineTo(x + barW - r2, y);
        ctx.quadraticCurveTo(x + barW, y, x + barW, y + r2);
        ctx.lineTo(x + barW, y + barH);
        ctx.lineTo(x, y + barH);
        ctx.lineTo(x, y + r2);
        ctx.quadraticCurveTo(x, y, x + r2, y);
      } else {
        ctx.rect(x, y, barW, Math.max(barH, 1));
      }
      ctx.fill();

      if (i % 5 === 0 || i === days.length - 1) {
        ctx.fillStyle = TEXT_COLOR;
        ctx.font = "10px -apple-system, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(shortLabel(d), x + barW / 2, H - CHART_PAD.bottom + 8);
      }
    });
    ctx.restore();

    ctx.fillStyle = TEXT_BRIGHT;
    ctx.font = "600 13px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Missions Completed — Last 30 Days", CHART_PAD.left, 8);
  }

  // ---------------------------------------------------------------------------
  // Chart 3 — Category breakdown (horizontal bars)
  // ---------------------------------------------------------------------------

  function renderCategoryChart(canvas, tasks) {
    var W = canvas.width;
    var H = canvas.height;
    var ctx = canvas.getContext("2d");
    clearCanvas(ctx, W, H);

    var counts = buildCategoryData(tasks);
    var total  = Object.keys(counts).reduce(function (s, k) { return s + counts[k]; }, 0);

    var catKeys = ["health", "work", "learning", "finance", "life"];
    var rows = catKeys.map(function (k) {
      return {
        key:   k,
        label: CATEGORY_META[k].label,
        emoji: CATEGORY_META[k].emoji,
        color: CATEGORY_META[k].color,
        count: counts[k] || 0,
        pct:   total > 0 ? (counts[k] || 0) / total : 0,
      };
    }).filter(function (r) { return true; }); // show all categories even if zero

    // Title
    ctx.fillStyle = TEXT_BRIGHT;
    ctx.font = "600 13px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("Completions by Category — All Time", 20, 8);

    if (total === 0) {
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = "14px -apple-system, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Complete some missions to see your breakdown.", W / 2, H / 2);
      return;
    }

    var rowH   = Math.floor((H - 50) / rows.length);
    var barMaxW = W - 180;
    var labelW  = 100;

    ctx.save();
    rows.forEach(function (row, i) {
      var y      = 40 + i * rowH;
      var midY   = y + rowH / 2;
      var barH   = Math.min(22, rowH - 10);
      var barY   = midY - barH / 2;
      var fillW  = row.pct * barMaxW;

      // Category emoji + label
      ctx.fillStyle = TEXT_COLOR;
      ctx.font = "12px -apple-system, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(row.emoji + " " + row.label, labelW - 8, midY);

      // Bar track (background)
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      ctx.beginPath();
      drawRoundRect(ctx, labelW, barY, barMaxW, barH, 4);
      ctx.fill();

      // Bar fill
      if (fillW > 0) {
        var grad = ctx.createLinearGradient(labelW, 0, labelW + fillW, 0);
        var hex = row.color;
        var rr = parseInt(hex.slice(1,3),16);
        var gg = parseInt(hex.slice(3,5),16);
        var bb = parseInt(hex.slice(5,7),16);
        grad.addColorStop(0, "rgba(" + rr + "," + gg + "," + bb + ",0.9)");
        grad.addColorStop(1, "rgba(" + rr + "," + gg + "," + bb + ",0.4)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        drawRoundRect(ctx, labelW, barY, Math.max(fillW, 4), barH, 4);
        ctx.fill();
      }

      // Count + percentage
      ctx.fillStyle = TEXT_BRIGHT;
      ctx.font = "11px -apple-system, system-ui, sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      var pctStr = (row.pct * 100).toFixed(0) + "% (" + row.count + ")";
      ctx.fillText(pctStr, labelW + barMaxW + 10, midY);
    });
    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // Canvas resize helper (matches roadmap.js pattern)
  // ---------------------------------------------------------------------------

  function sizeCanvas(canvas, container, height) {
    var dpr = window.devicePixelRatio || 1;
    var cssW = container.clientWidth;
    var cssH = height;
    canvas.width  = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width  = cssW  + "px";
    canvas.style.height = cssH  + "px";
    var ctx = canvas.getContext("2d");
    ctx.scale(dpr, dpr);
  }

  // ---------------------------------------------------------------------------
  // Render all three charts
  // ---------------------------------------------------------------------------

  function render() {
    // Only render if the stats page is visible
    var page = document.getElementById("page-stats");
    if (!page || page.classList.contains("hidden")) return;

    var state = window.APP.getState();
    var tasks = Array.isArray(state.tasks) ? state.tasks : [];

    var c1 = document.getElementById("stats-canvas-xp");
    var c2 = document.getElementById("stats-canvas-completions");
    var c3 = document.getElementById("stats-canvas-categories");
    if (!c1 || !c2 || !c3) return;

    var wrap1 = c1.parentElement;
    var wrap2 = c2.parentElement;
    var wrap3 = c3.parentElement;

    sizeCanvas(c1, wrap1, 220);
    sizeCanvas(c2, wrap2, 220);
    sizeCanvas(c3, wrap3, 300);

    renderXPChart(c1, tasks);
    renderCompletionsChart(c2, tasks);
    renderCategoryChart(c3, tasks);
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------

  function init() {
    // No-op; rendering is triggered on page navigation
  }

  // ---------------------------------------------------------------------------
  // Register
  // ---------------------------------------------------------------------------

  window.APP = window.APP || {};
  window.APP.modules     = window.APP.modules     || {};
  window.APP.renderHooks = window.APP.renderHooks || [];

  window.APP.modules.stats = { init: init, render: render };

  // Expose render so showPage can call it directly
  window.APP.renderStats = render;

  // Rerender on window resize if stats page is open
  window.addEventListener("resize", function () {
    var page = document.getElementById("page-stats");
    if (page && !page.classList.contains("hidden")) render();
  });

})();
