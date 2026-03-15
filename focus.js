// focus.js — Pomodoro focus timer module
(function () {
  "use strict";

  const WORK_MS  = 25 * 60 * 1000;
  const BREAK_MS =  5 * 60 * 1000;

  let mode        = "work";   // "work" | "break"
  let totalMs     = WORK_MS;
  let remainingMs = WORK_MS;
  let running     = false;
  let tickInterval  = null;
  let animFrame     = null;
  let lastTick      = null;
  let flashUntil    = 0;

  // ── helpers ──────────────────────────────────────────────────────────────────
  function fmtTime(ms) {
    const s = Math.ceil(ms / 1000);
    return `${String(Math.floor(s / 60)).padStart(2,"0")}:${String(s % 60).padStart(2,"0")}`;
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2,6); }
  function esc(s) {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }
  function ensureFocus(state) {
    if (!state.focus || !Array.isArray(state.focus.sessions)) state.focus = { sessions: [] };
  }
  function activeTasks() {
    const s = window.APP.getState();
    return Array.isArray(s.tasks) ? s.tasks.filter(t => t.status === "active") : [];
  }
  function selectedTask() {
    const sel = document.getElementById("focus-task-select");
    return sel ? sel.value || "Free focus" : "Free focus";
  }

  // ── canvas ring ──────────────────────────────────────────────────────────────
  function drawRing() {
    const canvas = document.getElementById("focus-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const cx = canvas.width / 2, cy = canvas.height / 2, R = 72;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // track
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.strokeStyle = "#1c2030";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.stroke();

    const now = Date.now();
    const flashing = now < flashUntil;

    if (flashing) {
      // full green ring on completion
      ctx.beginPath();
      ctx.arc(cx, cy, R, -Math.PI/2, -Math.PI/2 + Math.PI*2);
      ctx.strokeStyle = "#30d158";
      ctx.lineWidth = 12;
      ctx.lineCap = "round";
      ctx.stroke();
    } else if (remainingMs > 0) {
      const pct = remainingMs / totalMs;
      const grad = ctx.createLinearGradient(cx - R, cy, cx + R, cy);
      if (mode === "work") {
        grad.addColorStop(0, "#0a84ff"); grad.addColorStop(1, "#30d8ff");
      } else {
        grad.addColorStop(0, "#bf5af2"); grad.addColorStop(1, "#ff9f0a");
      }
      ctx.beginPath();
      ctx.arc(cx, cy, R, -Math.PI/2, -Math.PI/2 + Math.PI*2*pct);
      ctx.strokeStyle = grad;
      ctx.lineWidth = 12;
      ctx.lineCap = "round";
      ctx.stroke();
    }
  }

  // ── animation loop ───────────────────────────────────────────────────────────
  function animLoop() {
    drawRing();
    animFrame = requestAnimationFrame(animLoop);
  }
  function startAnim() { if (!animFrame) animLoop(); }
  function stopAnim()  { if (animFrame) { cancelAnimationFrame(animFrame); animFrame = null; } }

  // ── timer controls ───────────────────────────────────────────────────────────
  function start() {
    if (running) return;
    running = true;
    lastTick = performance.now();
    tickInterval = setInterval(tick, 50);
    startAnim();
    syncUI();
  }

  function pause() {
    if (!running) return;
    running = false;
    clearInterval(tickInterval); tickInterval = null;
    syncUI();
  }

  function reset() {
    pause();
    remainingMs = totalMs;
    flashUntil = 0;
    syncUI();
    drawRing();
  }

  function switchMode(m) {
    pause();
    mode      = m;
    totalMs   = m === "work" ? WORK_MS : BREAK_MS;
    remainingMs = totalMs;
    flashUntil  = 0;
    syncUI();
    drawRing();
  }

  function tick() {
    if (!running) return;
    const now = performance.now();
    remainingMs = Math.max(0, remainingMs - (now - lastTick));
    lastTick = now;
    updateTimeLabel();
    if (remainingMs <= 0) onComplete();
  }

  function onComplete() {
    pause();
    const xp = mode === "work" ? 50 : 10;
    const state = window.APP.getState();
    ensureFocus(state);
    state.focus.sessions.push({ id: uid(), date: new Date().toISOString(),
      durationMs: totalMs, taskText: selectedTask(), xpEarned: xp, type: mode });
    window.APP.touchState();
    window.APP.persist();
    window.APP.gainXP(xp);
    flashUntil = Date.now() + 1400;
    startAnim();
    setTimeout(() => { stopAnim(); drawRing(); renderHistory(); }, 1500);
    renderHistory();
  }

  // ── DOM sync ─────────────────────────────────────────────────────────────────
  function updateTimeLabel() {
    const el = document.getElementById("focus-time-display");
    if (el) el.textContent = fmtTime(remainingMs);
  }

  function syncUI() {
    updateTimeLabel();

    const phase = document.getElementById("focus-phase-label");
    if (phase) phase.textContent = mode === "work" ? "FOCUS" : "BREAK";

    const btnStart = document.getElementById("focus-btn-start");
    const btnPause = document.getElementById("focus-btn-pause");
    const btnReset = document.getElementById("focus-btn-reset");
    if (btnStart) { btnStart.disabled = running; btnStart.style.opacity = running ? "0.4" : "1"; }
    if (btnPause) { btnPause.disabled = !running; btnPause.style.opacity = !running ? "0.4" : "1"; }
    if (btnReset) btnReset.disabled = false;

    const bWork  = document.getElementById("focus-mode-work");
    const bBreak = document.getElementById("focus-mode-break");
    if (bWork)  { bWork.className  = mode === "work"  ? "btn-primary"   : "btn-secondary"; }
    if (bBreak) { bBreak.className = mode === "break" ? "btn-primary"   : "btn-secondary"; }
  }

  function populateTaskSelect() {
    const sel = document.getElementById("focus-task-select");
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = `<option value="Free focus">Free focus</option>`;
    activeTasks().forEach(t => {
      const o = document.createElement("option");
      o.value = o.textContent = t.text || t.title || t.id || "Task";
      sel.appendChild(o);
    });
    if (prev) { const m = Array.from(sel.options).find(o => o.value === prev); if (m) sel.value = prev; }
  }

  // ── history ──────────────────────────────────────────────────────────────────
  function renderHistory() {
    const el = document.getElementById("focus-history");
    if (!el) return;
    const state = window.APP.getState();
    ensureFocus(state);
    const sessions = [...state.focus.sessions].reverse().slice(0, 5);
    if (sessions.length === 0) {
      el.innerHTML = `<div class="section-card"><div class="section-label">Recent Sessions</div>
        <div class="hud-sub" style="padding:10px 0">No sessions yet.</div></div>`;
      return;
    }
    el.innerHTML = `<div class="section-card"><div class="section-label">Recent Sessions</div>
      <div class="focus-session-list">${sessions.map(s => `
        <div class="focus-session-item">
          <span>${s.type === "work" ? "🎯" : "☕"}</span>
          <span class="focus-session-task">${esc(s.taskText || "Free focus")}</span>
          <span class="hud-sub">${new Date(s.date).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
          <span class="focus-session-xp">+${s.xpEarned} XP</span>
        </div>`).join("")}
      </div></div>`;
  }

  // ── main render ──────────────────────────────────────────────────────────────
  function render() {
    const container = document.getElementById("focus-timer-container");
    if (!container) return;

    if (!document.getElementById("focus-canvas")) {
      container.innerHTML = `
        <div class="section-card" style="text-align:center;max-width:360px;margin:0 auto;">

          <div style="position:relative;width:160px;height:160px;margin:0 auto 16px;">
            <canvas id="focus-canvas" width="160" height="160" style="display:block;"></canvas>
          </div>

          <div id="focus-time-display" style="font-size:42px;font-weight:700;letter-spacing:2px;font-variant-numeric:tabular-nums;margin-bottom:4px;">25:00</div>
          <div id="focus-phase-label" style="font-size:12px;font-weight:600;letter-spacing:2px;color:var(--blue);margin-bottom:20px;">FOCUS</div>

          <div style="display:flex;gap:10px;justify-content:center;margin-bottom:12px;">
            <button id="focus-btn-start"  class="btn-primary">Start</button>
            <button id="focus-btn-pause"  class="btn-secondary">Pause</button>
            <button id="focus-btn-reset"  class="btn-secondary">Reset</button>
          </div>

          <div style="display:flex;gap:8px;justify-content:center;margin-bottom:16px;">
            <button id="focus-mode-work"  class="btn-primary">25 min Work</button>
            <button id="focus-mode-break" class="btn-secondary">5 min Break</button>
          </div>

          <select id="focus-task-select" class="focus-task-select" style="width:100%;margin-bottom:8px;"></select>
          <div class="hud-sub">Work session: +50 XP &nbsp;·&nbsp; Break: +10 XP</div>
        </div>`;

      document.getElementById("focus-btn-start") .addEventListener("click", start);
      document.getElementById("focus-btn-pause") .addEventListener("click", pause);
      document.getElementById("focus-btn-reset") .addEventListener("click", reset);
      document.getElementById("focus-mode-work") .addEventListener("click", () => switchMode("work"));
      document.getElementById("focus-mode-break").addEventListener("click", () => switchMode("break"));
    }

    populateTaskSelect();
    syncUI();
    drawRing();
    if (running) startAnim();
    renderHistory();
  }

  // ── init ─────────────────────────────────────────────────────────────────────
  function init() {
    const state = window.APP.getState();
    ensureFocus(state);
  }

  // ── register ─────────────────────────────────────────────────────────────────
  window.APP = window.APP || {};
  window.APP.modules      = window.APP.modules || {};
  window.APP.renderHooks  = window.APP.renderHooks || [];
  window.APP.modules.focus = { init, render };
  window.APP.renderHooks.push(render);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
