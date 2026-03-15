// ─── DOM References ───────────────────────────────────────────────────────────
const taskInput = document.getElementById("task-input");
const addBtn = document.getElementById("add-btn");
const taskList = document.getElementById("task-list");
const xpBar = document.getElementById("xp-bar");
const levelText = document.getElementById("level-indicator");
const streakText = document.getElementById("streak-indicator");
const categorySelect = document.getElementById("task-category");
const difficultySelect = document.getElementById("task-difficulty");
const prioritySelect = document.getElementById("task-priority");
const recommendationsEl = document.getElementById("recommendations");
const statsEl = document.getElementById("stats");
const authEmail = document.getElementById("auth-email");
const authPassword = document.getElementById("auth-password");
const signupBtn = document.getElementById("signup-btn");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const resetBtn = document.getElementById("reset-btn");
const authMessage = document.getElementById("auth-message");
const conflictBanner = document.getElementById("conflict-banner");
const conflictLocal = document.getElementById("conflict-local");
const conflictRemote = document.getElementById("conflict-remote");
const keepLocalBtn = document.getElementById("keep-local");
const keepRemoteBtn = document.getElementById("keep-remote");
const exportBtn = document.getElementById("export-btn");
const importInput = document.getElementById("import-input");
const achievementsEl = document.getElementById("achievements");
const hallEl = document.getElementById("hall-of-fame");
const epicInput = document.getElementById("epic-input");
const addEpicBtn = document.getElementById("add-epic");
const planEpicBtn = document.getElementById("plan-epic");
const subtaskInput = document.getElementById("subtask-input");
const addSubtaskBtn = document.getElementById("add-subtask");
const epicListEl = document.getElementById("epic-list");
const epicHint = document.getElementById("epic-hint");
const profileName = document.getElementById("profile-name");
const profileTagline = document.getElementById("profile-tagline");
const profilePublic = document.getElementById("profile-public");
const saveProfileBtn = document.getElementById("save-profile");
const profilePreview = document.getElementById("profile-preview");
const similarUsersEl = document.getElementById("similar-users");

// ─── Config ───────────────────────────────────────────────────────────────────
const config = {
    storage: {
        mode: "local",
        key: "moonManagerState",
        baseUrl: "",
        authToken: localStorage.getItem("moonAuthToken") || ""
    },
    sync: { enabled: true, intervalMs: 15000 },
    crypto: { enabled: true },
    premium: { advancedInsights: false, aiPlanner: false, cosmetics: false, coaching: false }
};

const STATE_VERSION = 4;

const defaultState = {
    version: STATE_VERSION,
    meta: { lastModified: null, lastSync: null, conflict: false },
    profile: { xp: 0, level: 1, xpPerTask: 20, streakDays: 0, lastCompletedDate: null },
    stats: { completionsByCategory: {}, completionsByDifficulty: {}, avgCompletionMs: 0, totalCompletions: 0 },
    tasks: [],
    epics: [],
    achievements: { unlocked: [] },
    hallOfFame: [],
    publicProfile: { displayName: "", tagline: "", isPublic: false },
    // Feature modules
    habits: [],
    focus: { sessions: [] },
    quests: { date: null, list: [] },
    boss: { weekId: null, title: "", hp: 0, maxHp: 100, defeated: false, rewardClaimed: false },
    loot: { inventory: [] },
    mood: [],
    skills: {
        health:   { xp: 0, level: 1 },
        work:     { xp: 0, level: 1 },
        learning: { xp: 0, level: 1 },
        finance:  { xp: 0, level: 1 },
        life:     { xp: 0, level: 1 }
    }
};

const achievementCatalog = [
    { id: "first-step", title: "First Step", desc: "Complete your first mission.", check: (s) => s.stats.totalCompletions >= 1 },
    { id: "streak-3", title: "Streak x3", desc: "Reach a 3-day streak.", check: (s) => s.profile.streakDays >= 3 },
    { id: "streak-7", title: "Streak x7", desc: "Reach a 7-day streak.", check: (s) => s.profile.streakDays >= 7 },
    { id: "level-5", title: "Orbital Cadet", desc: "Reach level 5.", check: (s) => s.profile.level >= 5 },
    { id: "epic-1", title: "Epic Commander", desc: "Complete an epic mission.", check: (s) => s.epics.some((e) => e.completedAt) }
];

let state = { ...defaultState };
let lastServerState = null;
let selectedEpicId = null;
let roadmapAnimId = null;
let roadmapTime = 0;

// ─── Module API (shared with feature modules) ─────────────────────────────────
window.APP = {
    getState:         () => state,
    setState:         (s) => { state = s; },
    touchState:       () => touchState(),
    gainXP:           (n) => gainXP(n),
    persist:          () => persistAndRender(),
    taskCompleteHooks: [],
    renderHooks:       [],
    modules:           {}
};

// ─── Galaxy Canvas ────────────────────────────────────────────────────────────
function initGalaxy() {
    const canvas = document.getElementById("galaxy-canvas");
    const ctx = canvas.getContext("2d");
    let stars = [];

    function createStars() {
        stars = Array.from({ length: 280 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            r: Math.random() * 1.4 + 0.15,
            alpha: Math.random() * 0.65 + 0.15,
            twinkleSpeed: Math.random() * 0.014 + 0.003,
            twinkleOffset: Math.random() * Math.PI * 2,
            drift: Math.random() * 0.04 + 0.008,
        }));
    }

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        createStars();
    }

    window.addEventListener("resize", resize);
    resize();

    let frame = 0;

    const nebulae = [
        { cx: 0.15, cy: 0.22, r: 0.48, color: "10,132,255",  a: 0.065 },
        { cx: 0.85, cy: 0.12, r: 0.42, color: "191,90,242",  a: 0.07  },
        { cx: 0.55, cy: 0.88, r: 0.5,  color: "255,55,95",   a: 0.05  },
        { cx: 0.3,  cy: 0.65, r: 0.35, color: "48,209,88",   a: 0.035 },
        { cx: 0.75, cy: 0.55, r: 0.3,  color: "255,159,10",  a: 0.03  },
    ];

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const w = canvas.width, h = canvas.height;

        nebulae.forEach(({ cx, cy, r, color, a }) => {
            const g = ctx.createRadialGradient(w * cx, h * cy, 0, w * cx, h * cy, w * r);
            g.addColorStop(0, `rgba(${color},${a})`);
            g.addColorStop(0.5, `rgba(${color},${a * 0.4})`);
            g.addColorStop(1, "transparent");
            ctx.fillStyle = g;
            ctx.fillRect(0, 0, w, h);
        });

        stars.forEach((s) => {
            const t = Math.sin(frame * s.twinkleSpeed + s.twinkleOffset);
            const alpha = s.alpha * (0.6 + 0.4 * t);
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
            ctx.fill();
            s.y -= s.drift;
            if (s.y < -2) { s.y = h + 2; s.x = Math.random() * w; }
        });

        frame++;
        requestAnimationFrame(draw);
    }

    draw();
}

// ─── Page Router ─────────────────────────────────────────────────────────────
// Per-page accent colors [R, G, B]
const PAGE_ACCENTS = {
    dashboard:    [10,  132, 255],
    missions:     [48,  209, 88],
    epics:        [191, 90,  242],
    achievements: [255, 159, 10],
    hall:         [100, 210, 255],
    profile:      [10,  132, 255],
    pro:          [191, 90,  242],
    roadmap:      [10,  132, 255],
    habits:       [48,  209, 88],
    focus:        [10,  132, 255],
    quests:       [255, 55,  95],
    skills:       [191, 90,  242],
    loot:         [255, 159, 10],
    mood:         [255, 55,  95],
};

function showPage(name) {
    if (roadmapAnimId) { cancelAnimationFrame(roadmapAnimId); roadmapAnimId = null; }
    document.querySelectorAll(".page").forEach((p) => p.classList.add("hidden"));
    document.querySelectorAll(".nav-item[data-page]").forEach((i) => i.classList.remove("active"));
    const page = document.getElementById(`page-${name}`);
    if (page) page.classList.remove("hidden");
    const navItem = document.querySelector(`.nav-item[data-page="${name}"]`);
    if (navItem) navItem.classList.add("active");
    if (name === "roadmap") startRoadmapLoop();

    // Update ambient accent color
    const [r, g, b] = PAGE_ACCENTS[name] || [10, 132, 255];
    const root = document.documentElement;
    root.style.setProperty('--accent-r', r);
    root.style.setProperty('--accent-g', g);
    root.style.setProperty('--accent-b', b);
    root.style.setProperty('--accent', `rgb(${r},${g},${b})`);
    root.style.setProperty('--accent-dim', `rgba(${r},${g},${b},0.18)`);
    root.style.setProperty('--accent-glow', `rgba(${r},${g},${b},0.35)`);
}

function showAuthScreen() {
    document.getElementById("screen-auth").classList.remove("hidden");
    document.getElementById("app-shell").classList.add("hidden");
}

function showAppShell() {
    document.getElementById("screen-auth").classList.add("hidden");
    document.getElementById("app-shell").classList.remove("hidden");
    showPage("dashboard");
    setTimeout(initOrb, 50);
}

// ─── Auth Tab Switching ───────────────────────────────────────────────────────
document.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
        document.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        const target = tab.dataset.tab;
        document.getElementById("auth-form-login").classList.toggle("hidden", target !== "login");
        document.getElementById("auth-form-signup").classList.toggle("hidden", target !== "signup");
    });
});

// ─── Nav Click Handlers ───────────────────────────────────────────────────────
document.querySelectorAll(".nav-item[data-page]").forEach((item) => {
    item.addEventListener("click", () => showPage(item.dataset.page));
});

// ─── Event Listeners ──────────────────────────────────────────────────────────
addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keypress", (e) => { if (e.key === "Enter") addTask(); });
signupBtn.addEventListener("click", signup);
loginBtn.addEventListener("click", login);
logoutBtn.addEventListener("click", logout);
resetBtn.addEventListener("click", resetPassword);
keepLocalBtn.addEventListener("click", () => resolveConflict("local"));
keepRemoteBtn.addEventListener("click", () => resolveConflict("remote"));
exportBtn.addEventListener("click", exportState);
importInput.addEventListener("change", importState);
addEpicBtn.addEventListener("click", addEpic);
addSubtaskBtn.addEventListener("click", addSubtask);
planEpicBtn.addEventListener("click", planEpic);
saveProfileBtn.addEventListener("click", saveProfile);
document.getElementById("hof-add").addEventListener("click", addHofManual);
document.getElementById("hof-ai").addEventListener("click", () => {
    authMessage.innerText = "AI Tokens are a Pro feature.";
});

// ─── Storage Adapters ─────────────────────────────────────────────────────────
function createStorageAdapter(cfg) {
    if (cfg.storage.mode === "remote") return createRemoteStorage(cfg.storage);
    return createLocalStorage(cfg.storage.key);
}

function createLocalStorage(key) {
    return {
        async load() {
            const raw = localStorage.getItem(key);
            if (!raw) return null;
            return decryptState(raw);
        },
        async save(nextState) {
            localStorage.setItem(key, encryptState(nextState));
        }
    };
}

function createRemoteStorage(storageCfg) {
    const baseUrl = storageCfg.baseUrl || "";
    const token = storageCfg.authToken || "";

    return {
        async load() {
            const res = await fetch(`${baseUrl}/api/state`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (!res.ok) throw new Error("Failed to load remote state");
            return await res.json();
        },
        async save(nextState) {
            const res = await fetch(`${baseUrl}/api/state`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ state: nextState, updatedAt: nextState.meta.lastModified })
            });
            if (!res.ok) throw new Error("Failed to save remote state");
        },
        async sync(nextState) {
            const res = await fetch(`${baseUrl}/api/sync`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify({ state: nextState, updatedAt: nextState.meta.lastModified })
            });
            if (!res.ok) throw new Error("Failed to sync remote state");
            return await res.json();
        },
        async saveProfile(profile) {
            const res = await fetch(`${baseUrl}/api/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                body: JSON.stringify(profile)
            });
            if (!res.ok) throw new Error("Failed to save profile");
            return await res.json();
        },
        async fetchSimilar() {
            const res = await fetch(`${baseUrl}/api/similar`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {}
            });
            if (!res.ok) throw new Error("Failed to load similar users");
            return await res.json();
        }
    };
}

let storage = createStorageAdapter(config);

// ─── State Normalization ──────────────────────────────────────────────────────
function normalizeState(loaded) {
    if (!loaded) return { ...defaultState };
    const profile = loaded.profile || {};
    const stats = loaded.stats || {};
    const meta = loaded.meta || {};
    return {
        version: STATE_VERSION,
        meta: { lastModified: meta.lastModified ?? null, lastSync: meta.lastSync ?? null, conflict: meta.conflict ?? false },
        profile: { xp: profile.xp ?? 0, level: profile.level ?? 1, xpPerTask: profile.xpPerTask ?? 20, streakDays: profile.streakDays ?? 0, lastCompletedDate: profile.lastCompletedDate ?? null },
        stats: { completionsByCategory: stats.completionsByCategory || {}, completionsByDifficulty: stats.completionsByDifficulty || {}, avgCompletionMs: stats.avgCompletionMs ?? 0, totalCompletions: stats.totalCompletions ?? 0 },
        tasks: Array.isArray(loaded.tasks) ? loaded.tasks : [],
        epics: Array.isArray(loaded.epics) ? loaded.epics : [],
        achievements: { unlocked: loaded.achievements?.unlocked || [] },
        hallOfFame: Array.isArray(loaded.hallOfFame) ? loaded.hallOfFame : [],
        publicProfile: { displayName: loaded.publicProfile?.displayName || "", tagline: loaded.publicProfile?.tagline || "", isPublic: loaded.publicProfile?.isPublic || false }
    };
}

// ─── Render ───────────────────────────────────────────────────────────────────
function render() {
    renderTasks();
    renderHud();
    renderInsights();
    renderConflictBanner();
    renderAchievements();
    renderHallOfFame();
    renderEpics();
    renderProfilePreview();
    renderSimilarUsers();
    // Feature module renders
    window.APP.renderHooks.forEach(fn => { try { fn(); } catch(e) { console.warn("render hook error", e); } });
}

function renderTasks() {
    taskList.innerHTML = "";
    const activeTasks = state.tasks.filter((t) => t.status === "active");
    activeTasks.forEach((task) => {
        const li = document.createElement("li");
        li.dataset.taskId = task.id;
        li.innerHTML = `
            <div class="task-content">
                <span class="task-text">${task.text}</span>
                <span class="task-meta">${task.category} · ${task.difficulty} · ${task.priority}</span>
            </div>
            <button class="delete-btn" title="Mark complete">✓</button>
        `;
        li.querySelector(".delete-btn").addEventListener("click", () => completeTask(task.id));
        taskList.appendChild(li);
    });
}

// ─── Spaceship Progression ────────────────────────────────────────────────────
const SHIPS = [
    { minLevel: 1,  name: "Rusty Pod",         draw: drawShipRustyPod },
    { minLevel: 3,  name: "Star Hopper",        draw: drawShipStarHopper },
    { minLevel: 5,  name: "Comet Rider",        draw: drawShipCometRider },
    { minLevel: 8,  name: "Nebula Cruiser",     draw: drawShipNebulaCruiser },
    { minLevel: 12, name: "Solar Falcon",       draw: drawShipSolarFalcon },
    { minLevel: 17, name: "Nova Striker",       draw: drawShipNovaStriker },
    { minLevel: 23, name: "Void Phantom",       draw: drawShipVoidPhantom },
    { minLevel: 30, name: "Celestial Titan",    draw: drawShipCelestialTitan },
];

function getShipForLevel(level) {
    let ship = SHIPS[0];
    for (const s of SHIPS) { if (level >= s.minLevel) ship = s; }
    return ship;
}

// Level 1-2: beat-up capsule, rust-brown
function drawShipRustyPod(ctx, w, h) {
    const cx = w / 2, cy = h / 2;
    // body — oval capsule
    ctx.save();
    const g = ctx.createRadialGradient(cx - 8, cy - 10, 4, cx, cy, 28);
    g.addColorStop(0, '#b08a5a'); g.addColorStop(0.6, '#7a5533'); g.addColorStop(1, '#3d2510');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(cx, cy + 4, 18, 26, 0, 0, Math.PI * 2); ctx.fill();
    // window
    ctx.fillStyle = '#1a2a3a'; ctx.beginPath(); ctx.ellipse(cx, cy - 6, 8, 8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#5a8a7a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgba(80,180,220,0.25)'; ctx.fill();
    // rust patches
    ctx.fillStyle = 'rgba(60,30,10,0.5)';
    ctx.beginPath(); ctx.ellipse(cx + 9, cy + 8, 5, 3, 0.8, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx - 10, cy + 14, 4, 3, -0.5, 0, Math.PI * 2); ctx.fill();
    // tiny thruster
    ctx.fillStyle = '#ff6a00';
    ctx.beginPath(); ctx.ellipse(cx, cy + 28, 8, 5, 0, 0, Math.PI * 2); ctx.fill();
    // faint flame
    const fg = ctx.createRadialGradient(cx, cy + 34, 1, cx, cy + 38, 10);
    fg.addColorStop(0, 'rgba(255,200,50,0.9)'); fg.addColorStop(1, 'rgba(255,80,0,0)');
    ctx.fillStyle = fg; ctx.beginPath(); ctx.ellipse(cx, cy + 36, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

// Level 3-4: small white rocket, red fins
function drawShipStarHopper(ctx, w, h) {
    const cx = w / 2, cy = h / 2;
    ctx.save();
    // nose cone
    const ng = ctx.createLinearGradient(cx - 10, cy - 30, cx + 10, cy - 10);
    ng.addColorStop(0, '#e0e8f0'); ng.addColorStop(1, '#8aaabb');
    ctx.fillStyle = ng;
    ctx.beginPath(); ctx.moveTo(cx, cy - 34); ctx.lineTo(cx - 11, cy - 10); ctx.lineTo(cx + 11, cy - 10); ctx.closePath(); ctx.fill();
    // body
    const bg = ctx.createLinearGradient(cx - 14, 0, cx + 14, 0);
    bg.addColorStop(0, '#c8d8e8'); bg.addColorStop(0.5, '#f0f4f8'); bg.addColorStop(1, '#9ab0c0');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.roundRect(cx - 11, cy - 12, 22, 32, 4); ctx.fill();
    // red stripe
    ctx.fillStyle = '#ff3b30'; ctx.beginPath(); ctx.rect(cx - 11, cy + 4, 22, 6); ctx.fill();
    // cockpit
    ctx.fillStyle = '#1a3a5a'; ctx.beginPath(); ctx.ellipse(cx, cy - 4, 6, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(100,200,255,0.3)'; ctx.fill();
    // left fin
    ctx.fillStyle = '#cc2222';
    ctx.beginPath(); ctx.moveTo(cx - 11, cy + 12); ctx.lineTo(cx - 22, cy + 30); ctx.lineTo(cx - 11, cy + 30); ctx.closePath(); ctx.fill();
    // right fin
    ctx.beginPath(); ctx.moveTo(cx + 11, cy + 12); ctx.lineTo(cx + 22, cy + 30); ctx.lineTo(cx + 11, cy + 30); ctx.closePath(); ctx.fill();
    // flame
    const ff = ctx.createRadialGradient(cx, cy + 36, 2, cx, cy + 40, 10);
    ff.addColorStop(0, 'rgba(255,230,100,1)'); ff.addColorStop(0.5, 'rgba(255,120,30,0.8)'); ff.addColorStop(1, 'rgba(255,60,0,0)');
    ctx.fillStyle = ff; ctx.beginPath(); ctx.ellipse(cx, cy + 38, 7, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

// Level 5-7: sleek blue/cyan rocket with glow
function drawShipCometRider(ctx, w, h) {
    const cx = w / 2, cy = h / 2;
    ctx.save();
    // glow aura
    const aura = ctx.createRadialGradient(cx, cy, 5, cx, cy, 35);
    aura.addColorStop(0, 'rgba(0,200,255,0.15)'); aura.addColorStop(1, 'rgba(0,100,200,0)');
    ctx.fillStyle = aura; ctx.beginPath(); ctx.ellipse(cx, cy, 35, 42, 0, 0, Math.PI * 2); ctx.fill();
    // body
    const bg = ctx.createLinearGradient(cx - 12, 0, cx + 12, 0);
    bg.addColorStop(0, '#003a6e'); bg.addColorStop(0.4, '#0a84ff'); bg.addColorStop(1, '#003a6e');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.moveTo(cx, cy - 36); ctx.quadraticCurveTo(cx + 13, cy - 10, cx + 12, cy + 20); ctx.lineTo(cx - 12, cy + 20); ctx.quadraticCurveTo(cx - 13, cy - 10, cx, cy - 36); ctx.closePath(); ctx.fill();
    // accent stripe
    ctx.strokeStyle = '#30d8ff'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx, cy - 30); ctx.lineTo(cx, cy + 18); ctx.stroke();
    // cockpit
    const cg = ctx.createRadialGradient(cx, cy - 12, 2, cx, cy - 10, 9);
    cg.addColorStop(0, '#80eeff'); cg.addColorStop(1, '#003878');
    ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(cx, cy - 10, 8, 9, 0, 0, Math.PI * 2); ctx.fill();
    // swept fins
    ctx.fillStyle = '#0a84ff';
    ctx.beginPath(); ctx.moveTo(cx - 12, cy + 10); ctx.lineTo(cx - 26, cy + 28); ctx.lineTo(cx - 12, cy + 22); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 12, cy + 10); ctx.lineTo(cx + 26, cy + 28); ctx.lineTo(cx + 12, cy + 22); ctx.closePath(); ctx.fill();
    // engine glow
    const eg = ctx.createRadialGradient(cx, cy + 24, 2, cx, cy + 30, 14);
    eg.addColorStop(0, 'rgba(0,230,255,1)'); eg.addColorStop(0.4, 'rgba(0,140,255,0.7)'); eg.addColorStop(1, 'rgba(0,80,200,0)');
    ctx.fillStyle = eg; ctx.beginPath(); ctx.ellipse(cx, cy + 28, 9, 13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}

// Level 8-11: purple cruiser with swept wings
function drawShipNebulaCruiser(ctx, w, h) {
    const cx = w / 2, cy = h / 2;
    ctx.save();
    // glow
    const aura = ctx.createRadialGradient(cx, cy, 5, cx, cy, 42);
    aura.addColorStop(0, 'rgba(180,80,255,0.2)'); aura.addColorStop(1, 'rgba(100,0,200,0)');
    ctx.fillStyle = aura; ctx.beginPath(); ctx.ellipse(cx, cy, 42, 44, 0, 0, Math.PI * 2); ctx.fill();
    // main hull
    const hg = ctx.createLinearGradient(cx - 16, 0, cx + 16, 0);
    hg.addColorStop(0, '#2a0050'); hg.addColorStop(0.5, '#bf5af2'); hg.addColorStop(1, '#2a0050');
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.moveTo(cx, cy - 34); ctx.bezierCurveTo(cx + 16, cy - 20, cx + 16, cy + 10, cx + 8, cy + 24); ctx.lineTo(cx - 8, cy + 24); ctx.bezierCurveTo(cx - 16, cy + 10, cx - 16, cy - 20, cx, cy - 34); ctx.closePath(); ctx.fill();
    // wings
    const wg = ctx.createLinearGradient(cx - 40, cy + 10, cx + 40, cy + 10);
    wg.addColorStop(0, '#1a0035'); wg.addColorStop(0.5, '#9040d0'); wg.addColorStop(1, '#1a0035');
    ctx.fillStyle = wg;
    ctx.beginPath(); ctx.moveTo(cx - 8, cy + 4); ctx.lineTo(cx - 40, cy + 28); ctx.lineTo(cx - 8, cy + 24); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 8, cy + 4); ctx.lineTo(cx + 40, cy + 28); ctx.lineTo(cx + 8, cy + 24); ctx.closePath(); ctx.fill();
    // cockpit
    const cg = ctx.createRadialGradient(cx, cy - 16, 1, cx, cy - 12, 8);
    cg.addColorStop(0, '#e8b0ff'); cg.addColorStop(1, '#400080');
    ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(cx, cy - 12, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
    // twin engine glow
    [-10, 10].forEach(ox => {
        const eg = ctx.createRadialGradient(cx + ox, cy + 28, 1, cx + ox, cy + 32, 10);
        eg.addColorStop(0, 'rgba(220,100,255,1)'); eg.addColorStop(1, 'rgba(100,0,200,0)');
        ctx.fillStyle = eg; ctx.beginPath(); ctx.ellipse(cx + ox, cy + 30, 6, 10, 0, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
}

// Level 12-16: silver/blue fighter — Solar Falcon
function drawShipSolarFalcon(ctx, w, h) {
    const cx = w / 2, cy = h / 2;
    ctx.save();
    // glow
    const aura = ctx.createRadialGradient(cx, cy, 4, cx, cy, 44);
    aura.addColorStop(0, 'rgba(255,200,60,0.18)'); aura.addColorStop(1, 'rgba(255,160,0,0)');
    ctx.fillStyle = aura; ctx.beginPath(); ctx.ellipse(cx, cy, 44, 44, 0, 0, Math.PI * 2); ctx.fill();
    // fuselage
    const fg = ctx.createLinearGradient(cx - 10, 0, cx + 10, 0);
    fg.addColorStop(0, '#2a3a50'); fg.addColorStop(0.5, '#c0d8f0'); fg.addColorStop(1, '#2a3a50');
    ctx.fillStyle = fg;
    ctx.beginPath(); ctx.moveTo(cx, cy - 38); ctx.lineTo(cx + 10, cy - 14); ctx.lineTo(cx + 10, cy + 22); ctx.lineTo(cx - 10, cy + 22); ctx.lineTo(cx - 10, cy - 14); ctx.closePath(); ctx.fill();
    // cockpit
    const cg = ctx.createLinearGradient(cx - 8, cy - 24, cx + 8, cy);
    cg.addColorStop(0, '#80ccff'); cg.addColorStop(1, '#003870');
    ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(cx, cy - 36); ctx.lineTo(cx + 8, cy - 12); ctx.lineTo(cx - 8, cy - 12); ctx.closePath(); ctx.fill();
    // wide swept wings
    const wg = ctx.createLinearGradient(cx - 44, cy + 8, cx + 44, cy + 8);
    wg.addColorStop(0, '#1a2a3a'); wg.addColorStop(0.5, '#7aaccc'); wg.addColorStop(1, '#1a2a3a');
    ctx.fillStyle = wg;
    ctx.beginPath(); ctx.moveTo(cx - 10, cy); ctx.lineTo(cx - 44, cy + 26); ctx.lineTo(cx - 28, cy + 26); ctx.lineTo(cx - 10, cy + 20); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 10, cy); ctx.lineTo(cx + 44, cy + 26); ctx.lineTo(cx + 28, cy + 26); ctx.lineTo(cx + 10, cy + 20); ctx.closePath(); ctx.fill();
    // golden accent lines on wings
    ctx.strokeStyle = '#ffd60a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cx - 10, cy + 10); ctx.lineTo(cx - 38, cy + 24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 10, cy + 10); ctx.lineTo(cx + 38, cy + 24); ctx.stroke();
    // triple engine exhaust
    [-9, 0, 9].forEach(ox => {
        const eg = ctx.createRadialGradient(cx + ox, cy + 26, 1, cx + ox, cy + 30, 7);
        eg.addColorStop(0, 'rgba(255,200,50,1)'); eg.addColorStop(0.5, 'rgba(255,120,0,0.7)'); eg.addColorStop(1, 'rgba(255,60,0,0)');
        ctx.fillStyle = eg; ctx.beginPath(); ctx.ellipse(cx + ox, cy + 28, 4, 8, 0, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
}

// Level 17-22: angular electric warship — Nova Striker
function drawShipNovaStriker(ctx, w, h) {
    const cx = w / 2, cy = h / 2;
    ctx.save();
    // electric aura
    const aura = ctx.createRadialGradient(cx, cy, 6, cx, cy, 44);
    aura.addColorStop(0, 'rgba(0,210,255,0.25)'); aura.addColorStop(1, 'rgba(0,100,255,0)');
    ctx.fillStyle = aura; ctx.beginPath(); ctx.ellipse(cx, cy, 44, 44, 0, 0, Math.PI * 2); ctx.fill();
    // main body angular
    const bg = ctx.createLinearGradient(cx - 14, 0, cx + 14, 0);
    bg.addColorStop(0, '#001a2e'); bg.addColorStop(0.5, '#0060a0'); bg.addColorStop(1, '#001a2e');
    ctx.fillStyle = bg;
    ctx.beginPath(); ctx.moveTo(cx, cy - 38); ctx.lineTo(cx + 14, cy - 10); ctx.lineTo(cx + 14, cy + 18); ctx.lineTo(cx - 14, cy + 18); ctx.lineTo(cx - 14, cy - 10); ctx.closePath(); ctx.fill();
    // angled front plate
    const ap = ctx.createLinearGradient(cx - 10, cy - 30, cx + 10, cy - 14);
    ap.addColorStop(0, '#00d4ff'); ap.addColorStop(1, '#0050a0');
    ctx.fillStyle = ap;
    ctx.beginPath(); ctx.moveTo(cx, cy - 38); ctx.lineTo(cx + 10, cy - 16); ctx.lineTo(cx - 10, cy - 16); ctx.closePath(); ctx.fill();
    // angular wings
    ctx.fillStyle = '#00406a';
    ctx.beginPath(); ctx.moveTo(cx - 14, cy - 4); ctx.lineTo(cx - 44, cy + 14); ctx.lineTo(cx - 40, cy + 22); ctx.lineTo(cx - 14, cy + 18); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 14, cy - 4); ctx.lineTo(cx + 44, cy + 14); ctx.lineTo(cx + 40, cy + 22); ctx.lineTo(cx + 14, cy + 18); ctx.closePath(); ctx.fill();
    // electric edges
    ctx.strokeStyle = '#30d4ff'; ctx.lineWidth = 1.5;
    [[-14, cy - 4, -44, cy + 14], [14, cy - 4, 44, cy + 14]].forEach(([x1, y1, x2, y2]) => {
        ctx.beginPath(); ctx.moveTo(cx + x1, y1); ctx.lineTo(cx + x2, y2); ctx.stroke();
    });
    ctx.strokeStyle = 'rgba(0,230,255,0.6)'; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(cx - 10, cy - 16); ctx.lineTo(cx + 10, cy - 16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 14, cy + 18); ctx.lineTo(cx + 14, cy + 18); ctx.stroke();
    // dual wide engines
    [-7, 7].forEach(ox => {
        const eg = ctx.createRadialGradient(cx + ox, cy + 22, 1, cx + ox, cy + 28, 10);
        eg.addColorStop(0, 'rgba(0,230,255,1)'); eg.addColorStop(0.5, 'rgba(0,120,255,0.8)'); eg.addColorStop(1, 'rgba(0,60,200,0)');
        ctx.fillStyle = eg; ctx.beginPath(); ctx.ellipse(cx + ox, cy + 26, 6, 11, 0, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
}

// Level 23-29: dark exotic ship — Void Phantom
function drawShipVoidPhantom(ctx, w, h) {
    const cx = w / 2, cy = h / 2;
    ctx.save();
    // dark void aura
    const aura = ctx.createRadialGradient(cx, cy, 4, cx, cy, 44);
    aura.addColorStop(0, 'rgba(140,40,255,0.3)'); aura.addColorStop(0.5, 'rgba(60,0,120,0.15)'); aura.addColorStop(1, 'rgba(20,0,60,0)');
    ctx.fillStyle = aura; ctx.beginPath(); ctx.ellipse(cx, cy, 44, 44, 0, 0, Math.PI * 2); ctx.fill();
    // sleek dark hull
    const hg = ctx.createLinearGradient(cx - 12, 0, cx + 12, 0);
    hg.addColorStop(0, '#0d001a'); hg.addColorStop(0.5, '#3a006a'); hg.addColorStop(1, '#0d001a');
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.moveTo(cx, cy - 40); ctx.bezierCurveTo(cx + 12, cy - 20, cx + 12, cy + 8, cx + 6, cy + 26); ctx.lineTo(cx - 6, cy + 26); ctx.bezierCurveTo(cx - 12, cy + 8, cx - 12, cy - 20, cx, cy - 40); ctx.closePath(); ctx.fill();
    // energy lines along hull
    ctx.strokeStyle = '#9b30ff'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 4, cy - 36); ctx.lineTo(cx - 4, cy + 22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 4, cy - 36); ctx.lineTo(cx + 4, cy + 22); ctx.stroke();
    // wide phantom wings — barely visible
    const wg = ctx.createLinearGradient(cx - 44, cy + 4, cx + 44, cy + 4);
    wg.addColorStop(0, 'rgba(60,0,120,0)'); wg.addColorStop(0.3, 'rgba(100,20,200,0.7)'); wg.addColorStop(0.5, 'rgba(140,60,255,0.9)'); wg.addColorStop(0.7, 'rgba(100,20,200,0.7)'); wg.addColorStop(1, 'rgba(60,0,120,0)');
    ctx.fillStyle = wg;
    ctx.beginPath(); ctx.moveTo(cx - 12, cy + 4); ctx.lineTo(cx - 44, cy + 20); ctx.lineTo(cx - 44, cy + 26); ctx.lineTo(cx - 12, cy + 22); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 12, cy + 4); ctx.lineTo(cx + 44, cy + 20); ctx.lineTo(cx + 44, cy + 26); ctx.lineTo(cx + 12, cy + 22); ctx.closePath(); ctx.fill();
    // void energy edge glow
    ctx.strokeStyle = 'rgba(160,80,255,0.8)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx - 12, cy + 4); ctx.lineTo(cx - 44, cy + 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 12, cy + 4); ctx.lineTo(cx + 44, cy + 20); ctx.stroke();
    // cockpit — glowing eye
    const cg = ctx.createRadialGradient(cx, cy - 18, 1, cx, cy - 14, 8);
    cg.addColorStop(0, '#e0b0ff'); cg.addColorStop(0.4, '#8020e0'); cg.addColorStop(1, '#200040');
    ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(cx, cy - 14, 6, 8, 0, 0, Math.PI * 2); ctx.fill();
    // twin purple exhausts
    [-6, 6].forEach(ox => {
        const eg = ctx.createRadialGradient(cx + ox, cy + 28, 1, cx + ox, cy + 34, 10);
        eg.addColorStop(0, 'rgba(200,100,255,1)'); eg.addColorStop(0.5, 'rgba(120,0,200,0.7)'); eg.addColorStop(1, 'rgba(60,0,120,0)');
        ctx.fillStyle = eg; ctx.beginPath(); ctx.ellipse(cx + ox, cy + 31, 5, 10, 0, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
}

// Level 30+: legendary golden titan
function drawShipCelestialTitan(ctx, w, h) {
    const cx = w / 2, cy = h / 2;
    ctx.save();
    // massive golden aura
    const aura = ctx.createRadialGradient(cx, cy, 6, cx, cy, 44);
    aura.addColorStop(0, 'rgba(255,220,60,0.35)'); aura.addColorStop(0.6, 'rgba(255,160,0,0.15)'); aura.addColorStop(1, 'rgba(200,100,0,0)');
    ctx.fillStyle = aura; ctx.beginPath(); ctx.ellipse(cx, cy, 44, 44, 0, 0, Math.PI * 2); ctx.fill();
    // outer wings — ornate
    const ow = ctx.createLinearGradient(cx - 44, cy + 8, cx + 44, cy + 8);
    ow.addColorStop(0, '#3a2200'); ow.addColorStop(0.3, '#c87000'); ow.addColorStop(0.5, '#ffd60a'); ow.addColorStop(0.7, '#c87000'); ow.addColorStop(1, '#3a2200');
    ctx.fillStyle = ow;
    ctx.beginPath(); ctx.moveTo(cx - 14, cy); ctx.lineTo(cx - 44, cy + 18); ctx.lineTo(cx - 42, cy + 28); ctx.lineTo(cx - 28, cy + 26); ctx.lineTo(cx - 14, cy + 22); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 14, cy); ctx.lineTo(cx + 44, cy + 18); ctx.lineTo(cx + 42, cy + 28); ctx.lineTo(cx + 28, cy + 26); ctx.lineTo(cx + 14, cy + 22); ctx.closePath(); ctx.fill();
    // inner hull
    const hg = ctx.createLinearGradient(cx - 14, 0, cx + 14, 0);
    hg.addColorStop(0, '#2a1800'); hg.addColorStop(0.4, '#ffa500'); hg.addColorStop(0.5, '#ffe066'); hg.addColorStop(0.6, '#ffa500'); hg.addColorStop(1, '#2a1800');
    ctx.fillStyle = hg;
    ctx.beginPath(); ctx.moveTo(cx, cy - 40); ctx.bezierCurveTo(cx + 14, cy - 22, cx + 14, cy + 6, cx + 8, cy + 26); ctx.lineTo(cx - 8, cy + 26); ctx.bezierCurveTo(cx - 14, cy + 6, cx - 14, cy - 22, cx, cy - 40); ctx.closePath(); ctx.fill();
    // golden filigree line
    ctx.strokeStyle = '#fff4a0'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(cx, cy - 36); ctx.lineTo(cx, cy + 22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - 8, cy - 10); ctx.lineTo(cx + 8, cy - 10); ctx.stroke();
    // cockpit — glowing white gem
    const cg = ctx.createRadialGradient(cx, cy - 16, 1, cx, cy - 12, 9);
    cg.addColorStop(0, '#ffffff'); cg.addColorStop(0.3, '#ffe080'); cg.addColorStop(1, '#8a5000');
    ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(cx, cy - 12, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
    // wing accent lines
    ctx.strokeStyle = '#ffe060'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(cx - 14, cy + 8); ctx.lineTo(cx - 40, cy + 22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + 14, cy + 8); ctx.lineTo(cx + 40, cy + 22); ctx.stroke();
    // quad engine blaze
    [-12, -4, 4, 12].forEach(ox => {
        const eg = ctx.createRadialGradient(cx + ox, cy + 28, 1, cx + ox, cy + 34, 9);
        eg.addColorStop(0, 'rgba(255,240,120,1)'); eg.addColorStop(0.4, 'rgba(255,160,0,0.8)'); eg.addColorStop(1, 'rgba(255,80,0,0)');
        ctx.fillStyle = eg; ctx.beginPath(); ctx.ellipse(cx + ox, cy + 31, 4, 9, 0, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
}

// ─── Living Orb (Dashboard Hero) ──────────────────────────────────────────────
let _orbAnimFrame = null;
function initOrb() {
    const canvas = document.getElementById('orb-canvas');
    if (!canvas) return;
    if (_orbAnimFrame) { cancelAnimationFrame(_orbAnimFrame); _orbAnimFrame = null; }

    // Size canvas to its CSS layout size
    function sizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width  = rect.width  || 420;
        canvas.height = rect.height || 420;
    }
    sizeCanvas();

    const ctx = canvas.getContext('2d');
    let W = canvas.width, H = canvas.height;
    const cx = () => W / 2, cy = () => H / 2;
    const R  = () => Math.min(W, H) * 0.38;

    // Mouse parallax
    let mx = 0, my = 0, lx = 0, ly = 0;
    canvas.addEventListener('mousemove', e => {
        const r = canvas.getBoundingClientRect();
        mx = (e.clientX - r.left) / W - 0.5;
        my = (e.clientY - r.top)  / H - 0.5;
    });
    canvas.addEventListener('mouseleave', () => { mx = 0; my = 0; });

    let t = 0;

    function draw() {
        W = canvas.width; H = canvas.height;
        ctx.clearRect(0, 0, W, H);
        const r   = R();
        const ox  = lx * r * 0.22;  // parallax offset
        const oy  = ly * r * 0.22;
        const bcx = cx() + ox, bcy = cy() + oy;

        // ── base sphere ──────────────────────────────────────────
        const sphere = ctx.createRadialGradient(bcx - r * 0.28, bcy - r * 0.28, r * 0.05, bcx, bcy, r);
        sphere.addColorStop(0,   'rgba(200,160,255,0.55)');
        sphere.addColorStop(0.3, 'rgba(124,58,237,0.45)');
        sphere.addColorStop(0.7, 'rgba(60,20,120,0.6)');
        sphere.addColorStop(1,   'rgba(10,6,20,0.9)');
        ctx.save();
        ctx.beginPath();
        ctx.arc(bcx, bcy, r, 0, Math.PI * 2);
        ctx.fillStyle = sphere;
        ctx.fill();
        ctx.restore();

        // ── aurora layer 1 — purple blob rotating ────────────────
        ctx.save();
        ctx.beginPath();
        ctx.arc(bcx, bcy, r, 0, Math.PI * 2);
        ctx.clip();
        const a1x = bcx + Math.cos(t * 0.008) * r * 0.35;
        const a1y = bcy + Math.sin(t * 0.008) * r * 0.28;
        const aurora1 = ctx.createRadialGradient(a1x, a1y, 0, a1x, a1y, r * 0.65);
        aurora1.addColorStop(0,   'rgba(180,100,255,0.55)');
        aurora1.addColorStop(0.5, 'rgba(120,40,220,0.25)');
        aurora1.addColorStop(1,   'rgba(80,20,160,0)');
        ctx.fillStyle = aurora1;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();

        // ── aurora layer 2 — cyan blob counter-rotating ──────────
        ctx.save();
        ctx.beginPath();
        ctx.arc(bcx, bcy, r, 0, Math.PI * 2);
        ctx.clip();
        const a2x = bcx + Math.cos(-t * 0.006 + 2.1) * r * 0.40;
        const a2y = bcy + Math.sin(-t * 0.006 + 2.1) * r * 0.32;
        const aurora2 = ctx.createRadialGradient(a2x, a2y, 0, a2x, a2y, r * 0.55);
        aurora2.addColorStop(0,   'rgba(80,200,255,0.40)');
        aurora2.addColorStop(0.5, 'rgba(20,160,220,0.18)');
        aurora2.addColorStop(1,   'rgba(0,100,180,0)');
        ctx.fillStyle = aurora2;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();

        // ── aurora layer 3 — magenta drifting ────────────────────
        ctx.save();
        ctx.beginPath();
        ctx.arc(bcx, bcy, r, 0, Math.PI * 2);
        ctx.clip();
        const a3x = bcx + Math.cos(t * 0.005 + 4.7) * r * 0.30;
        const a3y = bcy + Math.sin(t * 0.007 + 1.2) * r * 0.38;
        const aurora3 = ctx.createRadialGradient(a3x, a3y, 0, a3x, a3y, r * 0.50);
        aurora3.addColorStop(0,   'rgba(255,80,180,0.35)');
        aurora3.addColorStop(0.5, 'rgba(200,40,120,0.14)');
        aurora3.addColorStop(1,   'rgba(140,0,80,0)');
        ctx.fillStyle = aurora3;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();

        // ── rim darkening ─────────────────────────────────────────
        ctx.save();
        const rim = ctx.createRadialGradient(bcx, bcy, r * 0.62, bcx, bcy, r);
        rim.addColorStop(0,   'rgba(0,0,0,0)');
        rim.addColorStop(1,   'rgba(0,0,0,0.70)');
        ctx.beginPath();
        ctx.arc(bcx, bcy, r, 0, Math.PI * 2);
        ctx.fillStyle = rim;
        ctx.fill();
        ctx.restore();

        // ── specular highlight ────────────────────────────────────
        ctx.save();
        const hx = bcx - r * 0.30 + ox * 0.5;
        const hy = bcy - r * 0.32 + oy * 0.5;
        const spec = ctx.createRadialGradient(hx, hy, 0, hx, hy, r * 0.38);
        spec.addColorStop(0,   'rgba(255,255,255,0.28)');
        spec.addColorStop(0.4, 'rgba(220,200,255,0.10)');
        spec.addColorStop(1,   'rgba(180,160,255,0)');
        ctx.beginPath();
        ctx.arc(bcx, bcy, r, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = spec;
        ctx.fillRect(0, 0, W, H);
        ctx.restore();

        // ── orbital rings ─────────────────────────────────────────
        const rings = [
            { tilt: 0.42, speed: 0.009, color: 'rgba(180,120,255,0.45)', w: 1.5 },
            { tilt: -0.28, speed: -0.006, color: 'rgba(80,200,255,0.32)', w: 1.0 },
        ];
        rings.forEach(({ tilt, speed, color, w }) => {
            const angle = t * speed;
            ctx.save();
            ctx.translate(bcx, bcy);
            ctx.rotate(angle);
            ctx.scale(1, Math.sin(tilt));
            ctx.beginPath();
            ctx.arc(0, 0, r * 1.18, 0, Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = w;
            ctx.stroke();
            ctx.restore();
        });

        // ── orbiting particles ────────────────────────────────────
        const particles = [
            { phase: 0,    speed: 0.014, tilt: 0.42,  size: 3.0, color: 'rgba(200,160,255,0.9)' },
            { phase: 2.51, speed: 0.014, tilt: 0.42,  size: 2.0, color: 'rgba(160,100,255,0.7)' },
            { phase: 1.0,  speed: -0.009, tilt: -0.28, size: 2.5, color: 'rgba(80,210,255,0.85)' },
            { phase: 3.8,  speed: -0.009, tilt: -0.28, size: 1.8, color: 'rgba(60,180,240,0.65)' },
            { phase: 5.2,  speed: 0.011, tilt: 0.15,  size: 2.2, color: 'rgba(255,140,220,0.75)' },
        ];
        particles.forEach(({ phase, speed, tilt, size, color }) => {
            const a   = t * speed + phase;
            const px  = bcx + Math.cos(a) * r * 1.18;
            const py  = bcy + Math.sin(a) * r * 1.18 * Math.sin(tilt);
            ctx.save();
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.shadowBlur  = 8;
            ctx.shadowColor = color;
            ctx.fill();
            ctx.restore();
        });

        // lerp parallax
        lx += (mx - lx) * 0.06;
        ly += (my - ly) * 0.06;
        t++;
        _orbAnimFrame = requestAnimationFrame(draw);
    }

    draw();
}

let _shipAnimFrame = null;
function renderShip(level) {
    const canvas = document.getElementById('spaceship-canvas');
    const nameEl = document.getElementById('ship-name');
    if (!canvas) return;
    const ship = getShipForLevel(level);
    if (nameEl) nameEl.textContent = ship.name;
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    let t = 0;
    function frame() {
        ctx.clearRect(0, 0, w, h);
        ctx.save();
        // gentle float animation
        const floatY = Math.sin(t * 0.04) * 2;
        ctx.translate(0, floatY);
        ship.draw(ctx, w, h);
        ctx.restore();
        t++;
        _shipAnimFrame = requestAnimationFrame(frame);
    }
    if (_shipAnimFrame) cancelAnimationFrame(_shipAnimFrame);
    frame();
}

function renderHud() {
    levelText.innerText = state.profile.level;
    const xpPct = Math.min(100, Math.max(0, state.profile.xp));
    xpBar.style.width = `${xpPct}%`;
    streakText.innerText = `${state.profile.streakDays} day streak`;

    const el = (id) => document.getElementById(id);
    if (el("streak-number")) el("streak-number").textContent = state.profile.streakDays;
    if (el("total-completions")) el("total-completions").textContent = state.stats.totalCompletions;
    if (el("active-tasks-count")) el("active-tasks-count").textContent = state.tasks.filter((t) => t.status === "active").length;

    renderShip(state.profile.level);
}

function renderInsights() {
    const topCategory = mostFrequentKey(state.stats.completionsByCategory);
    const topDifficulty = mostFrequentKey(state.stats.completionsByDifficulty);
    const avgMins = state.stats.avgCompletionMs ? Math.round(state.stats.avgCompletionMs / 60000) : 0;
    recommendationsEl.innerText = topCategory
        ? `Recommended: Schedule 1 ${topCategory} mission today.`
        : "Recommended: Add your first mission and complete it.";
    statsEl.innerText = `Top category: ${topCategory || "n/a"}  ·  Top difficulty: ${topDifficulty || "n/a"}  ·  Avg completion: ${avgMins} min`;
}

function renderConflictBanner() {
    if (state.meta.conflict && lastServerState) {
        conflictBanner.classList.remove("hidden");
        conflictLocal.innerText = summarizeState(state);
        conflictRemote.innerText = summarizeState(lastServerState);
    } else {
        conflictBanner.classList.add("hidden");
    }
}

function renderAchievements() {
    achievementsEl.innerHTML = "";
    const unlocked = new Set(state.achievements.unlocked);
    achievementCatalog.forEach((ach) => {
        const card = document.createElement("div");
        card.className = `achievement-card${unlocked.has(ach.id) ? "" : " locked"}`;
        card.innerHTML = `
            <div class="badge">${unlocked.has(ach.id) ? "✓ Unlocked" : "Locked"}</div>
            <strong>${ach.title}</strong>
            <p style="font-size:13px;color:var(--text-secondary);margin-top:4px">${ach.desc}</p>
        `;
        achievementsEl.appendChild(card);
    });
}

function renderHallOfFame() {
    hallEl.innerHTML = "";
    if (state.hallOfFame.length === 0) {
        hallEl.innerHTML = `<div class="hint-row" style="padding:16px 0">No tokens yet. Complete an epic mission to earn your first.</div>`;
        return;
    }
    state.hallOfFame.forEach((token) => {
        const card = document.createElement("div");
        card.className = "hall-card";
        card.innerHTML = `
            <span class="badge">${token.rarity}</span>
            <strong>${token.title}</strong>
            <p style="font-size:13px;color:var(--text-secondary);margin-top:4px">${token.description}</p>
            <div class="hud-sub" style="margin-top:8px">${new Date(token.earnedAt).toLocaleDateString()}</div>
        `;
        hallEl.appendChild(card);
    });
}

function renderEpics() {
    epicListEl.innerHTML = "";
    if (state.epics.length === 0) {
        epicListEl.innerHTML = `<div class="hint-row" style="padding:16px 0">No epic missions yet. Create one above.</div>`;
        return;
    }
    state.epics.forEach((epic) => {
        const completed = epic.subtasks.filter((s) => s.completed).length;
        const total = epic.subtasks.length || 1;
        const progress = Math.round((completed / total) * 100);
        const card = document.createElement("div");
        card.className = "epic-card";
        card.innerHTML = `
            <strong style="font-size:16px">${epic.title}</strong>
            <div class="hud-sub" style="margin-top:4px">${completed}/${total} subtasks completed</div>
            <div class="epic-progress"><div style="width:${progress}%"></div></div>
            <div class="epic-actions">
                <button data-epic="${epic.id}" class="select-epic btn-secondary">Select</button>
                <button data-epic="${epic.id}" class="complete-epic btn-primary">Complete</button>
                <button data-epic="${epic.id}" class="hof-epic btn-secondary">→ Hall of Fame</button>
            </div>
        `;
        card.querySelector(".select-epic").addEventListener("click", () => {
            selectedEpicId = epic.id;
            epicHint.innerText = `Selected: ${epic.title}`;
        });
        card.querySelector(".complete-epic").addEventListener("click", () => completeEpic(epic.id));
        card.querySelector(".hof-epic").addEventListener("click", () => addHallToken(epic));
        epicListEl.appendChild(card);
    });
}

function renderProfilePreview() {
    profilePreview.innerHTML = `
        <div class="profile-card">
            <strong>${state.publicProfile.displayName || "Unnamed Captain"}</strong>
            <div class="hud-sub" style="margin-top:4px">${state.publicProfile.tagline || "No tagline yet."}</div>
            <div class="hud-sub" style="margin-top:4px">Tokens: ${state.hallOfFame.length}</div>
        </div>
    `;
}

function renderSimilarUsers() {
    similarUsersEl.innerHTML = "";
    const users = state.publicProfile.isPublic && state.similarUsers ? state.similarUsers : [];
    if (!users.length) {
        similarUsersEl.innerHTML = `<div class="hint-row">No public profiles yet.</div>`;
        return;
    }
    users.forEach((user) => {
        const card = document.createElement("div");
        card.style.cssText = "padding:12px 0;border-bottom:1px solid var(--border)";
        card.innerHTML = `<strong>${user.displayName}</strong><div class="hud-sub">${user.tagline} · Tokens: ${user.tokens}</div>`;
        similarUsersEl.appendChild(card);
    });
}

function summarizeState(snapshot) {
    const total = snapshot.tasks.length;
    const done = snapshot.tasks.filter((t) => t.status === "completed").length;
    return `Tasks: ${total} (${done} done)  ·  Level ${snapshot.profile.level}  ·  XP ${snapshot.profile.xp}`;
}

// ─── Task Actions ─────────────────────────────────────────────────────────────
function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;
    const task = {
        id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        text,
        category: categorySelect.value,
        difficulty: difficultySelect.value,
        priority: prioritySelect.value,
        status: "active",
        createdAt: new Date().toISOString(),
        completedAt: null,
        xpValue: calcTaskXp(difficultySelect.value, prioritySelect.value)
    };
    state.tasks.push(task);
    taskInput.value = "";
    touchState();
    persistAndRender();
}

function completeTask(taskId) {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;
    task.status = "completed";
    task.completedAt = new Date().toISOString();
    updateStats(task);
    updateStreak(task.completedAt);
    gainXP(task.xpValue);
    checkAchievements();
    touchState();
    persistAndRender();
    // Fire task-complete hooks for feature modules
    window.APP.taskCompleteHooks.forEach(fn => { try { fn(task); } catch(e) {} });
}

function addEpic() {
    const title = epicInput.value.trim();
    if (!title) return;
    state.epics.push({
        id: `epic_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title,
        subtasks: [],
        createdAt: new Date().toISOString(),
        completedAt: null
    });
    epicInput.value = "";
    touchState();
    persistAndRender();
}

function addSubtask() {
    const text = subtaskInput.value.trim();
    if (!text || !selectedEpicId) return;
    const epic = state.epics.find((e) => e.id === selectedEpicId);
    if (!epic) return;
    epic.subtasks.push({ id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, text, completed: false });
    subtaskInput.value = "";
    touchState();
    persistAndRender();
}

function completeEpic(epicId) {
    const epic = state.epics.find((e) => e.id === epicId);
    if (!epic) return;
    epic.completedAt = new Date().toISOString();
    epic.subtasks.forEach((s) => (s.completed = true));
    gainXP(50);
    checkAchievements();
    touchState();
    persistAndRender();
}

function planEpic() {
    if (!config.premium.aiPlanner) {
        authMessage.innerText = "AI Planner is a Pro feature.";
    }
}

function addHallToken(epic) {
    state.hallOfFame.push(generateAchievementToken(epic.title));
    touchState();
    persistAndRender();
}

function addHofManual() {
    const text = document.getElementById("hof-input").value.trim();
    if (!text) return;
    state.hallOfFame.push(generateAchievementToken(text));
    document.getElementById("hof-input").value = "";
    touchState();
    persistAndRender();
}

function generateAchievementToken(title) {
    return {
        id: `token_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: `Mission Complete: ${title}`,
        description: `You finished a major project: ${title}.`,
        rarity: "Legendary",
        earnedAt: new Date().toISOString()
    };
}

// ─── XP / Stats / Streak ──────────────────────────────────────────────────────
function calcTaskXp(difficulty, priority) {
    const base = state.profile.xpPerTask;
    const diffMult = difficulty === "hard" ? 1.6 : difficulty === "easy" ? 0.8 : 1.0;
    const prioMult = priority === "high" ? 1.3 : priority === "low" ? 0.9 : 1.0;
    const streakMult = Math.min(2, 1 + state.profile.streakDays * 0.05);
    return Math.round(base * diffMult * prioMult * streakMult);
}

function updateStats(task) {
    const durationMs = task.completedAt ? new Date(task.completedAt) - new Date(task.createdAt) : 0;
    const total = state.stats.totalCompletions + 1;
    state.stats.totalCompletions = total;
    state.stats.avgCompletionMs = state.stats.avgCompletionMs
        ? Math.round((state.stats.avgCompletionMs * (total - 1) + durationMs) / total)
        : durationMs;
    state.stats.completionsByCategory[task.category] = (state.stats.completionsByCategory[task.category] || 0) + 1;
    state.stats.completionsByDifficulty[task.difficulty] = (state.stats.completionsByDifficulty[task.difficulty] || 0) + 1;
}

function updateStreak(completedAtIso) {
    const today = new Date(completedAtIso).toDateString();
    const last = state.profile.lastCompletedDate ? new Date(state.profile.lastCompletedDate).toDateString() : null;
    if (!last) {
        state.profile.streakDays = 1;
    } else if (last === today) {
        state.profile.streakDays = Math.max(1, state.profile.streakDays);
    } else {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        state.profile.streakDays = last === yesterday ? state.profile.streakDays + 1 : 1;
    }
    state.profile.lastCompletedDate = completedAtIso;
}

function gainXP(amount) {
    state.profile.xp += amount;
    while (state.profile.xp >= 100) {
        state.profile.xp -= 100;
        state.profile.level += 1;
    }
}

function checkAchievements() {
    const unlocked = new Set(state.achievements.unlocked);
    let changed = false;
    achievementCatalog.forEach((ach) => {
        if (!unlocked.has(ach.id) && ach.check(state)) { unlocked.add(ach.id); changed = true; }
    });
    if (changed) state.achievements.unlocked = Array.from(unlocked);
}

function mostFrequentKey(map) {
    let best = null, bestVal = -1;
    Object.keys(map || {}).forEach((k) => { if (map[k] > bestVal) { best = k; bestVal = map[k]; } });
    return best;
}

function touchState() { state.meta.lastModified = new Date().toISOString(); }

// ─── Persistence ──────────────────────────────────────────────────────────────
async function persistAndRender() {
    await storage.save(state);
    render();
}

async function syncRemote() {
    if (config.storage.mode !== "remote" || !config.storage.authToken) return;
    try {
        const result = await storage.sync(state);
        if (result && result.action === "downloaded" && result.state) {
            const merged = normalizeState(result.state);
            merged.meta.lastSync = new Date().toISOString();
            merged.meta.conflict = !!state.meta.lastModified && result.updatedAt !== state.meta.lastModified;
            state = merged;
            lastServerState = normalizeState(result.state);
            await storage.save(state);
        } else if (result && result.action === "uploaded") {
            state.meta.lastSync = new Date().toISOString();
            state.meta.conflict = false;
            lastServerState = null;
            await storage.save(state);
        }
    } catch (err) { /* offline */ }
    render();
}

function resolveConflict(choice) {
    if (!state.meta.conflict) return;
    if (choice === "local") {
        state.meta.conflict = false;
        touchState();
        persistAndRender();
    } else if (choice === "remote" && lastServerState) {
        state = lastServerState;
        state.meta.conflict = false;
        touchState();
        persistAndRender();
    }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function signup() {
    authMessage.innerText = "";
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();
    if (!email || !password) return;
    const res = await fetch(`${config.storage.baseUrl}/api/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    authMessage.innerText = res.ok ? "Account created. You can now sign in." : "Signup failed. Try a different email.";
}

async function login() {
    authMessage.innerText = "";
    const email = authEmail.value.trim();
    const password = authPassword.value.trim();
    if (!email || !password) return;
    const res = await fetch(`${config.storage.baseUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    if (!res.ok) { authMessage.innerText = "Invalid credentials."; return; }
    const data = await res.json();
    if (data.token) {
        config.storage.authToken = data.token;
        localStorage.setItem("moonAuthToken", data.token);
        config.storage.mode = "remote";
        storage = createStorageAdapter(config);
        showAppShell();
        render();
        fetchSimilarUsers();
    }
}

function logout() {
    config.storage.authToken = "";
    localStorage.removeItem("moonAuthToken");
    config.storage.mode = "local";
    storage = createStorageAdapter(config);
    showAuthScreen();
}

async function resetPassword() {
    authMessage.innerText = "";
    const email = authEmail.value.trim();
    if (!email) return;
    const res = await fetch(`${config.storage.baseUrl}/api/reset-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
    });
    authMessage.innerText = res.ok ? "Reset email sent. Check your inbox." : "Reset request failed.";
}

// ─── Profile ──────────────────────────────────────────────────────────────────
async function saveProfile() {
    state.publicProfile.displayName = profileName.value.trim();
    state.publicProfile.tagline = profileTagline.value.trim();
    state.publicProfile.isPublic = profilePublic.checked;
    touchState();
    persistAndRender();
    if (config.storage.mode === "remote") {
        try {
            await storage.saveProfile({ displayName: state.publicProfile.displayName, tagline: state.publicProfile.tagline, isPublic: state.publicProfile.isPublic, tokens: state.hallOfFame });
        } catch (err) { /* silent */ }
    }
}

async function fetchSimilarUsers() {
    if (config.storage.mode !== "remote") return;
    try {
        const data = await storage.fetchSimilar();
        state.similarUsers = data.users || [];
    } catch (err) { state.similarUsers = []; }
}

// ─── Import / Export ──────────────────────────────────────────────────────────
function exportState() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "moon-manager-export.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

function importState(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        try {
            state = normalizeState(JSON.parse(reader.result));
            touchState();
            persistAndRender();
        } catch (err) { /* silent */ }
    };
    reader.readAsText(file);
}

// ─── Crypto ───────────────────────────────────────────────────────────────────
function encryptState(nextState) {
    if (!config.crypto.enabled) return JSON.stringify(nextState);
    const payload = JSON.stringify(nextState);
    if (!localStorage.getItem("moonCryptoPass")) localStorage.setItem("moonCryptoPass", cryptoRandom());
    const secret = localStorage.getItem("moonCryptoPass");
    const salt = cryptoRandom();
    return `enc:${salt}:${btoa(payload + secret + salt)}`;
}

function decryptState(raw) {
    if (!raw.startsWith("enc:")) return JSON.parse(raw);
    const parts = raw.split(":");
    if (parts.length < 3) return JSON.parse(raw);
    const salt = parts[1];
    const data = parts.slice(2).join(":");
    const secret = localStorage.getItem("moonCryptoPass") || "";
    const decoded = atob(data);
    return JSON.parse(decoded.replace(secret + salt, ""));
}

function cryptoRandom() {
    const buf = new Uint8Array(8);
    crypto.getRandomValues(buf);
    return Array.from(buf).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Roadmap ──────────────────────────────────────────────────────────────────
const ROUTE_COLORS = ["#0a84ff", "#30d158", "#ff9f0a", "#bf5af2", "#ff6b35", "#ff375f"];

// Each planet: [base, highlight, shadow, hasRing]
const PLANET_PALETTE = [
    ["#e8724a", "#f4b090", "#7a2a10", false],  // Mars
    ["#4a90e8", "#90c4ff", "#1a3a80", false],  // Ice world
    ["#c8a84a", "#f0d888", "#7a5a10", true ],  // Desert ring world
    ["#27ae60", "#70d890", "#0a5020", false],  // Forest
    ["#9b59b6", "#c890e0", "#4a1870", true ],  // Gas giant
    ["#e84a7a", "#f890b0", "#801030", false],  // Volcanic
    ["#40d0c8", "#80ece8", "#106860", false],  // Aqua
];

function startRoadmapLoop() {
    const canvas = document.getElementById("roadmap-canvas");
    if (!canvas) return;
    const container = canvas.parentElement;

    function resize() {
        canvas.width = container.clientWidth;
        canvas.height = Math.max(520, state.epics.length * 210 + 120);
    }
    resize();
    window.addEventListener("resize", resize);

    roadmapTime = 0;
    function loop() {
        roadmapTime += 0.022;
        drawRoadmap(canvas, roadmapTime);
        roadmapAnimId = requestAnimationFrame(loop);
    }
    loop();
}

function drawRoadmap(canvas, t) {
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Base fill
    ctx.fillStyle = "#030508";
    ctx.fillRect(0, 0, W, H);

    // Map grid
    ctx.strokeStyle = "rgba(255,255,255,0.032)";
    ctx.lineWidth = 1;
    for (let x = 0; x <= W; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y <= H; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    // Subtle corner glow
    const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.5);
    cg.addColorStop(0, "rgba(10,132,255,0.04)");
    cg.addColorStop(1, "transparent");
    ctx.fillStyle = cg;
    ctx.fillRect(0, 0, W, H);

    if (state.epics.length === 0) {
        ctx.fillStyle = "rgba(235,235,245,0.22)";
        ctx.font = "400 15px -apple-system, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("No epic missions yet — create epics to see your roadmap.", W / 2, H / 2);
        return;
    }

    const laneH = Math.max(130, Math.min(210, (H - 80) / state.epics.length));
    const PAD_L = 72, PAD_R = 88;

    state.epics.forEach((epic, i) => {
        const laneY = 60 + i * laneH + laneH / 2;
        const color = ROUTE_COLORS[i % ROUTE_COLORS.length];
        drawEpicRoute(ctx, epic, PAD_L, W - PAD_R, laneY, color, t);
    });
}

function drawEpicRoute(ctx, epic, x0, x1, laneY, color, t) {
    const subs = epic.subtasks || [];
    const epicDone = !!epic.completedAt;
    const firstIncomplete = subs.findIndex((s) => !s.completed);

    const totalPts = subs.length + 2; // start + subtasks + epic
    const archH = Math.min(44, 10 + subs.length * 5);

    function pt(idx) {
        const tv = idx / Math.max(1, totalPts - 1);
        const arch = -Math.sin(tv * Math.PI) * archH;
        return { x: x0 + tv * (x1 - x0), y: laneY + arch };
    }

    const nodes = [];
    nodes.push({ ...pt(0), kind: "start" });
    subs.forEach((s, j) => nodes.push({ ...pt(j + 1), kind: "sub", sub: s, idx: j, isNext: j === firstIncomplete }));
    nodes.push({ ...pt(totalPts - 1), kind: "epic" });

    // Roads
    for (let i = 0; i < nodes.length - 1; i++) {
        const a = nodes[i], b = nodes[i + 1];
        const done = a.kind === "start" ? (subs.length ? subs[0]?.completed : epicDone)
            : a.kind === "sub" ? (a.sub.completed && (b.kind === "epic" ? epicDone : b.sub?.completed))
            : false;
        drawRoadSeg(ctx, a.x, a.y, b.x, b.y, done, color);
    }

    // Nodes (drawn after roads so they appear on top)
    nodes.forEach((n) => {
        if (n.kind === "start")  drawEarthPin(ctx, n.x, n.y);
        else if (n.kind === "sub") drawPlanetPin(ctx, n.x, n.y, n.sub, n.idx + 1, n.isNext, t);
        else drawMoonPin(ctx, n.x, n.y, epic, t);
    });
}

function drawRoadSeg(ctx, x1, y1, x2, y2, done, color) {
    // Glow for completed travel path
    if (done) {
        ctx.save();
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
        ctx.strokeStyle = hexRgba(color, 0.18); ctx.lineWidth = 18; ctx.lineCap = "round"; ctx.stroke();
        ctx.restore();
    }
    // Main travel line
    ctx.save();
    if (!done) ctx.setLineDash([6, 10]);
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    ctx.strokeStyle = done ? hexRgba(color, 0.7) : "rgba(255,255,255,0.13)";
    ctx.lineWidth = done ? 2 : 1.5; ctx.lineCap = "round"; ctx.stroke();
    ctx.setLineDash([]); ctx.restore();

    // Tiny dots along incomplete path (star trail feel)
    if (!done) {
        const dx = x2 - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.floor(len / 22);
        for (let i = 1; i < steps; i++) {
            const f = i / steps;
            ctx.beginPath();
            ctx.arc(x1 + dx * f, y1 + dy * f, 1, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.fill();
        }
    }
}

function drawEarthPin(ctx, x, y) {
    const r = 11;
    // Atmosphere glow
    ctx.beginPath(); ctx.arc(x, y, r + 6, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(80,160,255,0.12)"; ctx.fill();
    // Ocean sphere
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, 1, x, y, r);
    g.addColorStop(0, "#6ec6ff"); g.addColorStop(0.55, "#1a78cc"); g.addColorStop(1, "#0a3a70");
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    // Land
    ctx.fillStyle = "rgba(50,170,70,0.75)";
    ctx.beginPath(); ctx.ellipse(x - 3, y - 2, 4, 5, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x + 4, y + 3, 3, 3.5, 0.6, 0, Math.PI * 2); ctx.fill();
    // Atmosphere rim
    ctx.beginPath(); ctx.arc(x, y, r + 1.5, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(140,210,255,0.28)"; ctx.lineWidth = 2; ctx.stroke();
    // Label
    ctx.fillStyle = "rgba(235,235,245,0.45)";
    ctx.font = "500 10px -apple-system, system-ui, sans-serif";
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillText("EARTH", x, y + r + 5);
}

function drawPlanetPin(ctx, x, y, sub, num, isNext, t) {
    const palette = PLANET_PALETTE[(num - 1) % PLANET_PALETTE.length];
    const [base, hi, shadow, hasRing] = palette;
    const r = 14;

    // Pulse halo for "next up"
    if (isNext) {
        const p = 0.5 + 0.5 * Math.sin(t * 3);
        ctx.beginPath(); ctx.arc(x, y, r + 10 + p * 6, 0, Math.PI * 2);
        ctx.fillStyle = hexRgba(base, 0.08 + p * 0.08); ctx.fill();
    }

    // Ring (Saturn-style) — drawn behind planet
    if (hasRing) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1, 0.3);
        ctx.beginPath();
        ctx.ellipse(0, 0, r + 10, r + 10, 0, 0, Math.PI * 2);
        ctx.strokeStyle = sub.completed ? hexRgba(base, 0.7) : hexRgba(base, 0.25);
        ctx.lineWidth = 4; ctx.stroke();
        ctx.restore();
    }

    // Planet sphere
    const sg = ctx.createRadialGradient(x - r * 0.38, y - r * 0.38, 1, x, y, r);
    sg.addColorStop(0, hi); sg.addColorStop(0.55, base); sg.addColorStop(1, shadow);
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = sub.completed ? sg : (() => {
        const dg = ctx.createRadialGradient(x - r * 0.38, y - r * 0.38, 1, x, y, r);
        dg.addColorStop(0, hexRgba(hi, 0.5)); dg.addColorStop(0.6, hexRgba(base, 0.35)); dg.addColorStop(1, hexRgba(shadow, 0.5));
        return dg;
    })();
    ctx.fill();
    // Shine
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = hexRgba(hi, sub.completed ? 0.4 : 0.15); ctx.lineWidth = 1.5; ctx.stroke();

    // Checkmark or number
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = sub.completed ? "#fff" : "rgba(255,255,255,0.55)";
    ctx.font = sub.completed ? "bold 11px sans-serif" : "600 10px -apple-system, system-ui, sans-serif";
    ctx.fillText(sub.completed ? "✓" : String(num), x, y);

    // Label (alternating above/below)
    const above = num % 2 === 0;
    ctx.font = (isNext ? "600" : "400") + " 10px -apple-system, system-ui, sans-serif";
    ctx.fillStyle = sub.completed ? "rgba(235,235,245,0.85)" : isNext ? hexRgba(base, 0.9) : "rgba(235,235,245,0.28)";
    ctx.textBaseline = above ? "bottom" : "top";
    ctx.fillText(cap(sub.text, 13), x, above ? y - r - (hasRing ? 14 : 5) : y + r + (hasRing ? 14 : 5));
}

function drawMoonPin(ctx, x, y, epic, t) {
    const r = 30, done = !!epic.completedAt;
    const pulse = done ? 1 : (0.55 + 0.45 * Math.sin(t * 1.5));

    // Moonlight glow
    ctx.beginPath(); ctx.arc(x, y, r + 28, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220,220,190,${0.04 * pulse})`; ctx.fill();
    ctx.beginPath(); ctx.arc(x, y, r + 14, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(220,220,190,${0.07 * pulse})`; ctx.fill();

    // Moon sphere (gray, slightly warm)
    const mg = ctx.createRadialGradient(x - r * 0.35, y - r * 0.38, 2, x, y, r);
    mg.addColorStop(0, done ? "#f0f0d8" : "#d8d8c0");
    mg.addColorStop(0.55, done ? "#c8c8a8" : "#a8a890");
    mg.addColorStop(1, "#585840");
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = mg; ctx.fill();

    // Craters
    const craters = [
        { dx: -10, dy: -7,  r: 5 },
        { dx:   7, dy:  9,  r: 7 },
        { dx:  -3, dy:  13, r: 3.5 },
        { dx:  12, dy: -10, r: 6 },
        { dx: -14, dy:  6,  r: 3 },
        { dx:   3, dy:  -4, r: 2.5 },
    ];
    craters.forEach(({ dx, dy, r: cr }) => {
        ctx.beginPath(); ctx.arc(x + dx, y + dy, cr, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(60,60,44,0.38)"; ctx.fill();
        ctx.beginPath(); ctx.arc(x + dx - 1, y + dy - 1, cr, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(240,240,210,0.18)"; ctx.lineWidth = 1; ctx.stroke();
    });

    // Rim highlight
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.strokeStyle = done ? "rgba(255,255,220,0.5)" : "rgba(220,220,180,0.2)";
    ctx.lineWidth = done ? 2 : 1.5; ctx.stroke();

    // Trophy when done
    if (done) {
        ctx.font = "18px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("🏆", x, y);
    }

    // Epic title above
    ctx.font = `700 12px -apple-system, system-ui, sans-serif`;
    ctx.fillStyle = done ? "#fff" : "rgba(220,220,180,0.9)";
    ctx.textAlign = "center"; ctx.textBaseline = "bottom";
    ctx.fillText(cap(epic.title, 20), x, y - r - 12);

    // "THE MOON" label
    ctx.font = "600 9px -apple-system, system-ui, sans-serif";
    ctx.fillStyle = "rgba(200,200,160,0.5)";
    ctx.textBaseline = "bottom";
    ctx.fillText("THE MOON", x, y - r - 3);

    // Progress below
    const comp = (epic.subtasks || []).filter(s => s.completed).length;
    const total = (epic.subtasks || []).length;
    ctx.font = "400 10px -apple-system, system-ui, sans-serif";
    ctx.fillStyle = "rgba(220,220,180,0.45)"; ctx.textBaseline = "top";
    ctx.fillText(done ? "Mission complete!" : `${comp}/${total} planets visited`, x, y + r + 7);
}

function hexRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

function cap(str, max) {
    if (!str) return "";
    return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
    initGalaxy();

    try {
        const loaded = await storage.load();
        state = normalizeState(loaded && loaded.state ? loaded.state : loaded);
    } catch (err) {
        state = { ...defaultState };
    }

    profileName.value = state.publicProfile.displayName || "";
    profileTagline.value = state.publicProfile.tagline || "";
    profilePublic.checked = !!state.publicProfile.isPublic;

    if (config.storage.authToken) {
        config.storage.mode = "remote";
        storage = createStorageAdapter(config);
        showAppShell();
        render();
        fetchSimilarUsers();
    } else {
        showAuthScreen();
        render();
    }

    if (config.sync.enabled) setInterval(syncRemote, config.sync.intervalMs);

    // Boot feature modules after state is ready
    setTimeout(() => {
        Object.values(window.APP.modules).forEach(m => { try { m.init && m.init(); } catch(e) { console.warn("module init error", e); } });
    }, 0);
}

init();
