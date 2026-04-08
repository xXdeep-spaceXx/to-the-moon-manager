(function () {
  "use strict";

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  var XP_PER_LEVEL = 100;

  var SKILLS = {
    health:   { label: "Health",   emoji: "❤️",  color: "#ff375f" },
    work:     { label: "Work",     emoji: "💼",  color: "#0a84ff" },
    learning: { label: "Learning", emoji: "📚",  color: "#bf5af2" },
    finance:  { label: "Finance",  emoji: "💰",  color: "#ff9f0a" },
    life:     { label: "Life",     emoji: "🌱",  color: "#30d158" },
  };

  var SKILL_KEYS = ["health", "work", "learning", "finance", "life"];

  var XP_BY_DIFFICULTY = { easy: 15, medium: 25, hard: 40 };

  // Node layout: pentagon, starting at the top (-90°), 72° apart, r=140
  var NODE_ANGLE_OFFSET = -Math.PI / 2;
  var NODE_RADIUS_FROM_CENTER = 140;
  var NODE_CIRCLE_RADIUS = 40;
  var CANVAS_HEIGHT = 420;

  // ---------------------------------------------------------------------------
  // Module-level animation state
  // ---------------------------------------------------------------------------

  var animId = null;
  var animFrame = 0;

  // Last rendered node positions — updated every draw, used for click detection
  var lastNodePositions = [];

  // ---------------------------------------------------------------------------
  // Default state
  // ---------------------------------------------------------------------------

  function ensureSkills(state) {
    if (!state.skills || typeof state.skills !== "object") {
      state.skills = {};
    }
    SKILL_KEYS.forEach(function (key) {
      if (!state.skills[key] || typeof state.skills[key] !== "object") {
        state.skills[key] = { xp: 0, level: 1 };
      }
      if (typeof state.skills[key].xp !== "number")   state.skills[key].xp    = 0;
      if (typeof state.skills[key].level !== "number") state.skills[key].level = 1;
    });
  }

  // ---------------------------------------------------------------------------
  // Color helpers
  // ---------------------------------------------------------------------------

  // Parse a #rrggbb hex color and return "rgba(r,g,b,a)"
  function hexRgba(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return "rgba(" + r + "," + g + "," + b + "," + alpha + ")";
  }

  // ---------------------------------------------------------------------------
  // Node positions
  // ---------------------------------------------------------------------------

  function getNodePositions(cx, cy) {
    return SKILL_KEYS.map(function (key, i) {
      var angle = NODE_ANGLE_OFFSET + (i * 2 * Math.PI) / SKILL_KEYS.length;
      return {
        key: key,
        x: cx + NODE_RADIUS_FROM_CENTER * Math.cos(angle),
        y: cy + NODE_RADIUS_FROM_CENTER * Math.sin(angle),
      };
    });
  }

  // ---------------------------------------------------------------------------
  // Canvas drawing
  // ---------------------------------------------------------------------------

  function drawGrid(ctx, width, height) {
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    var step = 60;
    for (var x = 0; x < width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (var y = 0; y < height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawConnectingLines(ctx, nodes, skills) {
    // Adjacent pairs in pentagon order (wrap around)
    var n = nodes.length;
    for (var i = 0; i < n; i++) {
      var a = nodes[i];
      var b = nodes[(i + 1) % n];
      var levelA = skills[a.key].level;
      var levelB = skills[b.key].level;
      var minLevel = Math.min(levelA, levelB);

      var strokeColor;
      if (minLevel >= 5) {
        // Use color of the higher-level node
        var dominantKey = levelA >= levelB ? a.key : b.key;
        strokeColor = hexRgba(SKILLS[dominantKey].color, 0.2);
      } else if (minLevel >= 2) {
        strokeColor = "rgba(255,255,255,0.12)";
      } else {
        strokeColor = "rgba(255,255,255,0.06)";
      }

      ctx.save();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawNode(ctx, node, skillData, pulseAlpha) {
    var skill = SKILLS[node.key];
    var color = skill.color;
    var x = node.x;
    var y = node.y;
    var r = NODE_CIRCLE_RADIUS;

    // ── Glow (animated pulse on unlocked nodes) ──────────────────────────────
    if (skillData.level > 1) {
      var glowAlpha = 0.08 + 0.07 * pulseAlpha;
      var grd = ctx.createRadialGradient(x, y, r * 0.5, x, y, r * 2.2);
      grd.addColorStop(0, hexRgba(color, glowAlpha));
      grd.addColorStop(1, hexRgba(color, 0));
      ctx.save();
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // ── Circle background ─────────────────────────────────────────────────────
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = hexRgba(color, 0.15);
    ctx.fill();
    ctx.strokeStyle = hexRgba(color, 0.6);
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // ── XP progress arc ───────────────────────────────────────────────────────
    var xpFraction = Math.min(skillData.xp / XP_PER_LEVEL, 1);
    var startAngle = -Math.PI / 2;                        // top
    var endAngle   = startAngle + xpFraction * Math.PI * 2;

    // Track (full circle, dim)
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r + 7, 0, Math.PI * 2);
    ctx.strokeStyle = hexRgba(color, 0.12);
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.restore();

    // Progress
    if (xpFraction > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r + 7, startAngle, endAngle);
      ctx.strokeStyle = color;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.restore();
    }

    // ── Emoji ─────────────────────────────────────────────────────────────────
    ctx.save();
    ctx.font = "22px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(skill.emoji, x, y);
    ctx.restore();

    // ── Level badge ───────────────────────────────────────────────────────────
    var badgeX = x;
    var badgeY = y + r + 18;
    var badgeR = 12;

    ctx.save();
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeR, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(String(skillData.level), badgeX, badgeY);
    ctx.restore();

    // ── Skill label ───────────────────────────────────────────────────────────
    ctx.save();
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.fillText(skill.label, x, badgeY + badgeR + 3);
    ctx.restore();
  }

  function drawCanvas(canvas, state, pulseAlpha) {
    var ctx = canvas.getContext("2d");
    var w = canvas.width;
    var h = canvas.height;

    // Background
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#030508";
    ctx.fillRect(0, 0, w, h);

    drawGrid(ctx, w, h);

    var cx = w / 2;
    var cy = h / 2 - 10; // slight upward offset to leave room for badges+labels

    var nodes = getNodePositions(cx, cy);

    // Persist node positions for click detection
    lastNodePositions = nodes;

    drawConnectingLines(ctx, nodes, state.skills);

    nodes.forEach(function (node) {
      drawNode(ctx, node, state.skills[node.key], pulseAlpha);
    });
  }

  // ---------------------------------------------------------------------------
  // Stats row (DOM)
  // ---------------------------------------------------------------------------

  function renderStatsRow(container, state) {
    var existingStats = container.querySelector(".skills-stats-row");
    if (existingStats) existingStats.remove();

    var div = document.createElement("div");
    div.className = "skills-stats-row";
    div.style.cssText = [
      "display:flex",
      "flex-wrap:wrap",
      "gap:8px",
      "padding:12px 0 4px",
      "justify-content:center",
    ].join(";");

    div.innerHTML = SKILL_KEYS.map(function (key) {
      var skill = SKILLS[key];
      var data  = state.skills[key];
      var pct   = Math.round((data.xp / XP_PER_LEVEL) * 100);
      return [
        '<div style="',
          "background:", hexRgba(skill.color, 0.1), ";",
          "border:1px solid ", hexRgba(skill.color, 0.3), ";",
          "border-radius:10px;",
          "padding:8px 14px;",
          "min-width:90px;",
          "text-align:center;",
          "flex:1;",
        '">',
          '<div style="font-size:1.3rem;line-height:1.2;">', skill.emoji, "</div>",
          '<div style="font-size:0.7rem;color:rgba(255,255,255,0.5);margin:2px 0;">', skill.label, "</div>",
          '<div style="font-size:1rem;font-weight:700;color:', skill.color, ';">Lv ', data.level, "</div>",
          '<div style="font-size:0.65rem;color:rgba(255,255,255,0.4);">', pct, "% XP</div>",
        "</div>",
      ].join("");
    }).join("");

    container.appendChild(div);
  }

  // ---------------------------------------------------------------------------
  // Animation loop
  // ---------------------------------------------------------------------------

  function stopAnimation() {
    if (animId !== null) {
      cancelAnimationFrame(animId);
      animId = null;
    }
  }

  function startAnimation(canvas, state) {
    stopAnimation();

    function loop() {
      animFrame++;
      var pulseAlpha = (Math.sin(animFrame * 0.04) + 1) / 2; // 0..1
      drawCanvas(canvas, state, pulseAlpha);
      animId = requestAnimationFrame(loop);
    }

    animId = requestAnimationFrame(loop);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  function render() {
    var container = document.getElementById("skill-tree-container");
    if (!container) return;

    var state = window.APP.getState();
    ensureSkills(state);

    // Ensure canvas
    var canvas = container.querySelector("#skill-tree-canvas");
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "skill-tree-canvas";
      canvas.style.cssText = "display:block;width:100%;";
      // Insert at the top of the container
      container.insertBefore(canvas, container.firstChild);
    }

    // Size canvas to container
    canvas.width  = container.clientWidth || 400;
    canvas.height = CANVAS_HEIGHT;

    // Bind click listener (idempotent)
    bindCanvasClick(canvas, container);

    // Render the static stats row
    renderStatsRow(container, state);

    // Start (or restart) the animation loop
    startAnimation(canvas, state);
  }

  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // Skill XP Toast
  // ---------------------------------------------------------------------------

  function showSkillToast(skillKey, xpGain, newLevel) {
    var skill = SKILLS[skillKey];
    if (!skill) return;

    var toast = document.createElement("div");
    toast.className = "skill-xp-toast";

    var lvlUpLine = newLevel
      ? '<span class="skill-toast-lvl">Level up! Now Lv ' + newLevel + ' \u2b06</span>'
      : "";

    toast.innerHTML =
      '<span class="skill-toast-emoji">' + skill.emoji + "</span>" +
      '<span class="skill-toast-text">' +
        '<span class="skill-toast-label" style="color:' + skill.color + ';">' + skill.label + "</span>" +
        '<span class="skill-toast-xp" style="color:' + skill.color + ';">+' + xpGain + " XP</span>" +
        lvlUpLine +
      "</span>";

    document.body.appendChild(toast);

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        toast.classList.add("skill-xp-toast--visible");
      });
    });

    setTimeout(function () {
      toast.classList.remove("skill-xp-toast--visible");
      toast.addEventListener("transitionend", function () { toast.remove(); }, { once: true });
      setTimeout(function () { if (toast.parentNode) toast.remove(); }, 500);
    }, 2800);
  }

  // ---------------------------------------------------------------------------
  // Skill category → task category mapping (human readable)
  // ---------------------------------------------------------------------------

  var SKILL_CATEGORY_LABELS = {
    health:   "Health tasks",
    work:     "Work tasks",
    learning: "Learning tasks",
    finance:  "Finance tasks",
    life:     "Life tasks",
  };

  // Milestone messages by level thresholds
  function getMilestoneHint(nextLevel) {
    if (nextLevel <= 2)  return "Level " + nextLevel + ": Getting started — every rep counts.";
    if (nextLevel <= 4)  return "Level " + nextLevel + ": Building momentum. Keep the streak alive.";
    if (nextLevel === 5) return "Level " + nextLevel + ": Expert status unlocked — you're serious about this.";
    if (nextLevel <= 9)  return "Level " + nextLevel + ": Advanced practitioner. The gap is widening.";
    if (nextLevel === 10) return "Level " + nextLevel + ": Master tier. Legendary commitment.";
    return "Level " + nextLevel + ": Uncharted territory. Push the limit.";
  }

  // ---------------------------------------------------------------------------
  // Skill Detail Panel
  // ---------------------------------------------------------------------------

  function closeSkillDetail() {
    var existing = document.getElementById("skill-detail-panel");
    if (existing) {
      existing.classList.remove("skill-detail-panel--visible");
      existing.addEventListener("transitionend", function handler() {
        existing.removeEventListener("transitionend", handler);
        if (existing.parentNode) existing.parentNode.removeChild(existing);
      });
      // Fallback removal
      setTimeout(function () { if (existing.parentNode) existing.parentNode.removeChild(existing); }, 400);
    }
  }

  function showSkillDetail(skillKey, container) {
    // Remove any existing panel
    closeSkillDetail();

    var state = window.APP.getState();
    ensureSkills(state);

    var skill    = SKILLS[skillKey];
    var skillData = state.skills[skillKey];
    var color    = skill.color;

    var level      = skillData.level;
    var xp         = skillData.xp;
    var totalXp    = (level - 1) * XP_PER_LEVEL + xp;
    var xpPct      = Math.round((xp / XP_PER_LEVEL) * 100);
    var nextLevel  = level + 1;
    var milestone  = getMilestoneHint(nextLevel);
    var categories = SKILL_CATEGORY_LABELS[skillKey] || skillKey + " tasks";

    var panel = document.createElement("div");
    panel.id = "skill-detail-panel";
    panel.className = "skill-detail-panel";

    panel.innerHTML = [
      '<button class="skill-detail-close" id="skill-detail-close" aria-label="Close">&#x2715;</button>',
      '<div class="skill-detail-emoji">', skill.emoji, '</div>',
      '<div class="skill-detail-name" style="color:', color, ';">', skill.label, '</div>',
      '<div class="skill-detail-level">Level ', level, '</div>',
      '<div class="skill-detail-xp-label">',
        '<span>', xp, ' / ', XP_PER_LEVEL, ' XP to next level</span>',
        '<span class="skill-detail-xp-pct">', xpPct, '%</span>',
      '</div>',
      '<div class="skill-detail-xp-track">',
        '<div class="skill-detail-xp-fill" style="width:', xpPct, '%;background:', color, ';"></div>',
      '</div>',
      '<div class="skill-detail-row">',
        '<span class="skill-detail-meta-label">Powered by</span>',
        '<span class="skill-detail-meta-value">', categories, '</span>',
      '</div>',
      '<div class="skill-detail-row">',
        '<span class="skill-detail-meta-label">Total XP earned</span>',
        '<span class="skill-detail-meta-value" style="color:', color, ';">', totalXp, ' XP</span>',
      '</div>',
      '<div class="skill-detail-milestone">',
        '<span class="skill-detail-milestone-icon">&#127919;</span>',
        '<span>', milestone, '</span>',
      '</div>',
    ].join("");

    container.appendChild(panel);

    // Trigger fade-in on next frame
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        panel.classList.add("skill-detail-panel--visible");
      });
    });

    // Close button
    document.getElementById("skill-detail-close").addEventListener("click", function () {
      closeSkillDetail();
    });

    // Close on outside click
    function onOutsideClick(e) {
      if (!panel.contains(e.target) && e.target.id !== "skill-tree-canvas") {
        closeSkillDetail();
        document.removeEventListener("click", onOutsideClick);
      }
    }
    setTimeout(function () {
      document.addEventListener("click", onOutsideClick);
    }, 100);
  }

  // ---------------------------------------------------------------------------
  // Canvas click handler — wire up once per canvas instance
  // ---------------------------------------------------------------------------

  function bindCanvasClick(canvas, container) {
    if (canvas.dataset.clickBound) return;
    canvas.dataset.clickBound = "1";

    canvas.style.cursor = "pointer";

    canvas.addEventListener("click", function (e) {
      var rect = canvas.getBoundingClientRect();
      // Scale from CSS pixels to canvas pixels
      var scaleX = canvas.width  / rect.width;
      var scaleY = canvas.height / rect.height;
      var cx = (e.clientX - rect.left)  * scaleX;
      var cy = (e.clientY - rect.top)   * scaleY;

      var HIT_RADIUS = 48; // slightly larger than NODE_CIRCLE_RADIUS for comfort
      var hit = null;
      for (var i = 0; i < lastNodePositions.length; i++) {
        var n = lastNodePositions[i];
        var dx = cx - n.x;
        var dy = cy - n.y;
        if (Math.sqrt(dx * dx + dy * dy) <= HIT_RADIUS) {
          hit = n.key;
          break;
        }
      }

      if (hit) {
        showSkillDetail(hit, container);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Task complete hook
  // ---------------------------------------------------------------------------

  function onTaskComplete(task) {
    if (!task) return;

    var categoryToSkill = {
      health:   "health",
      work:     "work",
      learning: "learning",
      finance:  "finance",
      life:     "life",
    };

    var skillKey = categoryToSkill[task.category];
    if (!skillKey) return;

    var xpGain = XP_BY_DIFFICULTY[task.difficulty] || 0;
    if (xpGain <= 0) return;

    var state = window.APP.getState();
    ensureSkills(state);

    var skill = state.skills[skillKey];
    var levelBefore = skill.level;
    skill.xp += xpGain;

    // Chain level-ups
    while (skill.xp >= XP_PER_LEVEL) {
      skill.xp -= XP_PER_LEVEL;
      skill.level += 1;
    }

    var leveledUp = skill.level > levelBefore;
    showSkillToast(skillKey, xpGain, leveledUp ? skill.level : null);

    window.APP.touchState();
    window.APP.persist();
  }

  // ---------------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------------

  function init() {
    var state = window.APP.getState();
    ensureSkills(state);
    render();
  }

  // ---------------------------------------------------------------------------
  // Hook into showPage so we stop the animation when leaving the skills page
  // ---------------------------------------------------------------------------

  // Wrap window.APP.showPage (if it exists) once the DOM is ready
  function hookShowPage() {
    if (!window.APP || typeof window.APP.showPage !== "function") return;
    var original = window.APP.showPage;
    window.APP.showPage = function (pageId) {
      if (pageId !== "skills") {
        stopAnimation();
      }
      return original.apply(this, arguments);
    };
  }

  // ---------------------------------------------------------------------------
  // Register
  // ---------------------------------------------------------------------------

  window.APP = window.APP || {};
  window.APP.modules      = window.APP.modules      || {};
  window.APP.renderHooks  = window.APP.renderHooks  || [];
  window.APP.taskCompleteHooks = window.APP.taskCompleteHooks || [];

  window.APP.modules.skills = { init: init, render: render };
  window.APP.renderHooks.push(render);
  window.APP.taskCompleteHooks.push(onTaskComplete);

  // Hook showPage after the current call stack (so script.js has had a chance
  // to define it first).
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hookShowPage);
  } else {
    setTimeout(hookShowPage, 0);
  }

})();
