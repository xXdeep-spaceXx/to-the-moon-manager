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
const taskDueInput = document.getElementById("task-due");
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
    loot: { inventory: [], activeBoost: null, streakShield: false, focusBonus: 0 },
    mood: [],
    skills: {
        health:   { xp: 0, level: 1 },
        work:     { xp: 0, level: 1 },
        learning: { xp: 0, level: 1 },
        finance:  { xp: 0, level: 1 },
        life:     { xp: 0, level: 1 }
    },
    challenges: []
};

const achievementCatalog = [
    // ── Missions ──────────────────────────────────────────────────────────────
    { id: "first-step",      tier: "bronze",   title: "First Step",        desc: "Complete your first mission.",          check: (s) => s.stats.totalCompletions >= 1 },
    { id: "missions-10",     tier: "silver",   title: "Mission Veteran",   desc: "Complete 10 missions.",                 check: (s) => s.stats.totalCompletions >= 10 },
    { id: "missions-50",     tier: "gold",     title: "Mission Expert",    desc: "Complete 50 missions.",                 check: (s) => s.stats.totalCompletions >= 50 },
    { id: "missions-100",    tier: "platinum", title: "Mission Legend",    desc: "Complete 100 missions.",                check: (s) => s.stats.totalCompletions >= 100 },

    // ── Streaks ───────────────────────────────────────────────────────────────
    { id: "streak-3",        tier: "bronze",   title: "Streak x3",         desc: "Reach a 3-day streak.",                 check: (s) => s.profile.streakDays >= 3 },
    { id: "streak-7",        tier: "silver",   title: "Streak x7",         desc: "Reach a 7-day streak.",                 check: (s) => s.profile.streakDays >= 7 },
    { id: "streak-14",       tier: "gold",     title: "Fortnight Fire",    desc: "Reach a 14-day streak.",                check: (s) => s.profile.streakDays >= 14 },
    { id: "streak-30",       tier: "platinum", title: "Unstoppable",       desc: "Reach a 30-day streak.",                check: (s) => s.profile.streakDays >= 30 },

    // ── XP / Level ────────────────────────────────────────────────────────────
    { id: "level-3",         tier: "bronze",   title: "Rising Star",       desc: "Reach level 3.",                        check: (s) => s.profile.level >= 3 },
    { id: "level-5",         tier: "silver",   title: "Orbital Cadet",     desc: "Reach level 5.",                        check: (s) => s.profile.level >= 5 },
    { id: "level-10",        tier: "gold",     title: "Stellar Pilot",     desc: "Reach level 10.",                       check: (s) => s.profile.level >= 10 },
    { id: "level-15",        tier: "platinum", title: "Cosmic Admiral",    desc: "Reach level 15.",                       check: (s) => s.profile.level >= 15 },

    // ── Habits ────────────────────────────────────────────────────────────────
    { id: "habit-first",     tier: "bronze",   title: "New Habit",         desc: "Log your first habit check-in.",        check: (s) => Array.isArray(s.habits) && s.habits.some((h) => h.completedDates && h.completedDates.length >= 1) },
    { id: "habit-streak-7",  tier: "silver",   title: "Habit Warrior",     desc: "Maintain any habit for 7 consecutive days.", check: (s) => {
        if (!Array.isArray(s.habits)) return false;
        return s.habits.some((h) => {
            if (!h.completedDates || h.completedDates.length < 7) return false;
            // Check for 7 consecutive dates ending at the most recent logged date
            const sorted = [...h.completedDates].sort();
            let streak = 1;
            for (let i = sorted.length - 1; i > 0; i--) {
                const diff = (new Date(sorted[i]) - new Date(sorted[i - 1])) / 86400000;
                if (diff === 1) { streak++; if (streak >= 7) return true; }
                else if (diff > 1) streak = 1;
            }
            return streak >= 7;
        });
    }},
    { id: "habit-streak-30", tier: "gold",     title: "Habit Master",      desc: "Maintain any habit for 30 consecutive days.", check: (s) => {
        if (!Array.isArray(s.habits)) return false;
        return s.habits.some((h) => {
            if (!h.completedDates || h.completedDates.length < 30) return false;
            const sorted = [...h.completedDates].sort();
            let streak = 1;
            for (let i = sorted.length - 1; i > 0; i--) {
                const diff = (new Date(sorted[i]) - new Date(sorted[i - 1])) / 86400000;
                if (diff === 1) { streak++; if (streak >= 30) return true; }
                else if (diff > 1) streak = 1;
            }
            return streak >= 30;
        });
    }},

    // ── Focus Sessions ────────────────────────────────────────────────────────
    { id: "focus-first",     tier: "bronze",   title: "In the Zone",       desc: "Complete your first focus session.",    check: (s) => s.focus && Array.isArray(s.focus.sessions) && s.focus.sessions.length >= 1 },
    { id: "focus-10",        tier: "silver",   title: "Deep Focus",        desc: "Complete 10 focus sessions.",           check: (s) => s.focus && Array.isArray(s.focus.sessions) && s.focus.sessions.length >= 10 },
    { id: "focus-50",        tier: "gold",     title: "Flow State",        desc: "Complete 50 focus sessions.",           check: (s) => s.focus && Array.isArray(s.focus.sessions) && s.focus.sessions.length >= 50 },

    // ── Loot ──────────────────────────────────────────────────────────────────
    { id: "loot-first",      tier: "bronze",   title: "Lucky Drop",        desc: "Collect your first loot item.",         check: (s) => s.loot && Array.isArray(s.loot.inventory) && s.loot.inventory.length >= 1 },
    { id: "loot-10",         tier: "silver",   title: "Treasure Hunter",   desc: "Collect 10 loot items.",                check: (s) => s.loot && Array.isArray(s.loot.inventory) && s.loot.inventory.length >= 10 },
    { id: "loot-legendary",  tier: "gold",     title: "Legendary Haul",    desc: "Collect a legendary loot item.",        check: (s) => s.loot && Array.isArray(s.loot.inventory) && s.loot.inventory.some((item) => item.rarity === "legendary") },

    // ── Mood ──────────────────────────────────────────────────────────────────
    { id: "mood-first",      tier: "bronze",   title: "Self-Aware",        desc: "Log your first mood check-in.",         check: (s) => Array.isArray(s.mood) && s.mood.length >= 1 },
    { id: "mood-streak-7",   tier: "silver",   title: "Mind Monitor",      desc: "Log mood check-ins 7 days in a row.",  check: (s) => {
        if (!Array.isArray(s.mood) || s.mood.length < 7) return false;
        const dates = s.mood.map((e) => e.date).sort();
        let streak = 1;
        for (let i = dates.length - 1; i > 0; i--) {
            const diff = (new Date(dates[i]) - new Date(dates[i - 1])) / 86400000;
            if (diff === 1) { streak++; if (streak >= 7) return true; }
            else if (diff > 1) streak = 1;
        }
        return streak >= 7;
    }},

    // ── Quests ────────────────────────────────────────────────────────────────
    { id: "quest-first",     tier: "bronze",   title: "Quest Taker",       desc: "Complete your first daily quest.",      check: (s) => s.quests && Array.isArray(s.quests.list) && s.quests.list.some((q) => q.claimed) },
    { id: "boss-first",      tier: "silver",   title: "Boss Slayer",       desc: "Defeat your first weekly boss.",        check: (s) => s.boss && s.boss.defeated },

    // ── Epics ─────────────────────────────────────────────────────────────────
    { id: "epic-create",     tier: "bronze",   title: "Epic Dreamer",      desc: "Create your first epic mission.",       check: (s) => Array.isArray(s.epics) && s.epics.length >= 1 },
    { id: "epic-1",          tier: "gold",     title: "Epic Commander",    desc: "Complete an epic mission.",             check: (s) => s.epics.some((e) => e.completedAt) },

    // ── Skills ────────────────────────────────────────────────────────────────
    { id: "skill-level-3",   tier: "bronze",   title: "Skill Awakening",   desc: "Reach level 3 in any skill.",           check: (s) => s.skills && Object.values(s.skills).some((sk) => sk.level >= 3) },
    { id: "skill-level-5",   tier: "silver",   title: "Skill Mastery",     desc: "Reach level 5 in any skill.",           check: (s) => s.skills && Object.values(s.skills).some((sk) => sk.level >= 5) },
];

let state = { ...defaultState };
let lastServerState = null;
let selectedEpicId = null;
let roadmapAnimId = null;
let roadmapTime = 0;

// ─── Task Filter State ────────────────────────────────────────────────────────
let taskFilterText = '';
let taskFilterCategory = 'all';
let taskFilterStatus = 'active';

// ─── Module API (shared with feature modules) ─────────────────────────────────
window.APP = {
    getState:         () => state,
    setState:         (s) => { state = s; },
    touchState:       () => touchState(),
    gainXP:           (n) => gainXP(n),
    persist:          () => persistAndRender(),
    checkChallenges:  () => checkChallenges(),
    taskCompleteHooks: [],
    renderHooks:       [],
    modules:           {}
};

// ─── Galaxy Canvas (Three.js) ─────────────────────────────────────────────────
function initGalaxy() {
    const canvas = document.getElementById("galaxy-canvas");
    if (!canvas || !window.THREE) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 600;

    function resize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", resize);
    resize();

    // ── main star field ──────────────────────────────────────────────────────
    const starCount  = 4500;
    const starPos    = new Float32Array(starCount * 3);
    const starColor  = new Float32Array(starCount * 3);
    const starSize   = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
        // distribute in a large sphere volume
        const r   = 400 + Math.random() * 1200;
        const phi = Math.acos(2 * Math.random() - 1);
        const th  = Math.random() * Math.PI * 2;
        starPos[i*3]   = r * Math.sin(phi) * Math.cos(th);
        starPos[i*3+1] = r * Math.sin(phi) * Math.sin(th);
        starPos[i*3+2] = r * Math.cos(phi);
        // slightly warm/cool tint
        const warm = Math.random();
        starColor[i*3]   = 0.85 + warm * 0.15;
        starColor[i*3+1] = 0.85 + (1 - warm) * 0.05;
        starColor[i*3+2] = 0.90 + Math.random() * 0.10;
        starSize[i] = Math.random() * 1.8 + 0.4;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute("color",    new THREE.BufferAttribute(starColor, 3));
    starGeo.setAttribute("size",     new THREE.BufferAttribute(starSize, 1));

    const starMat = new THREE.PointsMaterial({
        size: 1.4, vertexColors: true, transparent: true,
        opacity: 0.85, sizeAttenuation: true
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ── nebula clusters ──────────────────────────────────────────────────────
    const nebulaDefs = [
        { hex: 0xff6520, n: 360, spread: 380, pos: [-500,  200, -400] },  // orange — dominant
        { hex: 0xbf5af2, n: 260, spread: 300, pos: [ 600, -150, -500] },  // purple
        { hex: 0xff9040, n: 220, spread: 280, pos: [ 200,  400, -300] },  // warm orange
        { hex: 0x0a84ff, n: 180, spread: 260, pos: [ 100, -500, -200] },  // blue accent
        { hex: 0xff6520, n: 160, spread: 220, pos: [ 450,  350, -500] },  // orange echo
        { hex: 0x7c3aed, n: 140, spread: 200, pos: [-300, -300, -600] },  // deep purple
    ];

    nebulaDefs.forEach(({ hex, n, spread, pos }) => {
        const geo = new THREE.BufferGeometry();
        const p   = new Float32Array(n * 3);
        const c   = new Float32Array(n * 3);
        const s   = new Float32Array(n);
        const col = new THREE.Color(hex);
        for (let i = 0; i < n; i++) {
            p[i*3]   = pos[0] + (Math.random() - 0.5) * spread;
            p[i*3+1] = pos[1] + (Math.random() - 0.5) * spread;
            p[i*3+2] = pos[2] + (Math.random() - 0.5) * spread;
            const br = 0.3 + Math.random() * 0.7;
            c[i*3]   = col.r * br;
            c[i*3+1] = col.g * br;
            c[i*3+2] = col.b * br;
            s[i] = Math.random() * 4 + 1.5;
        }
        geo.setAttribute("position", new THREE.BufferAttribute(p, 3));
        geo.setAttribute("color",    new THREE.BufferAttribute(c, 3));
        geo.setAttribute("size",     new THREE.BufferAttribute(s, 1));
        scene.add(new THREE.Points(geo, new THREE.PointsMaterial({
            size: 3.5, vertexColors: true, transparent: true,
            opacity: 0.28, sizeAttenuation: true
        })));
    });

    // ── animate ──────────────────────────────────────────────────────────────
    let t = 0;
    (function animate() {
        requestAnimationFrame(animate);
        stars.rotation.y = t * 0.00008;
        stars.rotation.x = t * 0.00003;
        camera.position.x = Math.sin(t * 0.0004) * 30;
        camera.position.y = Math.cos(t * 0.0003) * 20;
        renderer.render(scene, camera);
        t++;
    })();
}

// ─── Page Router ─────────────────────────────────────────────────────────────
// Per-page accent colors [R, G, B]
const PAGE_ACCENTS = {
    dashboard:    [255, 101, 32],
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

let _currentPage = 'dashboard';

function positionOrb(name, animate) {
    const orb = document.getElementById('orb-wrap');
    if (!orb) return;

    // Disable transition for instant placement (first load)
    if (!animate) orb.style.transition = 'none';

    if (name === 'dashboard') {
        const heroLeft   = document.querySelector('.dash-hero-left');
        const firstCard  = document.querySelector('#page-dashboard .section-card');

        let left = 640;
        let top  = 60;
        let size = Math.min(Math.round(window.innerWidth * 0.38), 460);

        if (heroLeft) {
            const hr = heroLeft.getBoundingClientRect();
            left = Math.round(hr.right + 24);

            const heroTop   = hr.top;
            const insightTop = firstCard ? firstCard.getBoundingClientRect().top : heroTop + 500;
            // Rings extend ~22% beyond the wrapper edge — subtract that buffer so rings clear the card
            const maxBottom = insightTop - 100;
            const availH    = maxBottom - heroTop;
            const availW    = document.documentElement.clientWidth - left - 8;
            size = Math.min(Math.round(availH), Math.round(availW), 480);
            size = Math.max(size, 160);

            // Position orb: top edge near the top of the viewport, above the content
            top = Math.max(Math.round(heroTop) - 80, 16);
        }

        // Don't overflow right edge
        left = Math.min(left, document.documentElement.clientWidth - size - 8);

        orb.style.width   = size + 'px';
        orb.style.height  = size + 'px';
        orb.style.left    = left + 'px';
        orb.style.right   = 'auto';
        orb.style.top     = top + 'px';
        orb.style.opacity = '1';
    } else {
        const vw   = document.documentElement.clientWidth;
        const vh   = document.documentElement.clientHeight;
        const size = Math.min(Math.round(vw * 0.38), 500);
        const left = Math.min(Math.round(vw * 0.55), vw - size - 40);
        const top  = Math.round((vh - size) / 2);
        orb.style.width   = size + 'px';
        orb.style.height  = size + 'px';
        orb.style.left    = left + 'px';
        orb.style.right   = 'auto';
        orb.style.top     = top + 'px';
        orb.style.opacity = '0.9';
    }

    if (!animate) {
        orb.offsetHeight; // force reflow
        orb.style.transition = '';
    }
}

function showPage(name) {
    _currentPage = name;
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

    // Move orb — JS-computed positions so it's always fully visible
    positionOrb(name, true);

    // Switch orb shape + colour for this page
    if (window.APP && window.APP.setOrbShape) window.APP.setOrbShape(name, r, g, b);
    else if (window.APP && window.APP.orbTransition) window.APP.orbTransition(r, g, b);
}

function showAuthScreen() {
    document.getElementById("screen-auth").classList.remove("hidden");
    document.getElementById("app-shell").classList.add("hidden");
}

function showAppShell() {
    document.getElementById("screen-auth").classList.add("hidden");
    document.getElementById("app-shell").classList.remove("hidden");
    showPage("dashboard");
    setTimeout(() => { positionOrb("dashboard", false); initOrb(); }, 50);
    window.addEventListener('resize', () => positionOrb(_currentPage || 'dashboard', false));
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

// Task filter listeners
document.getElementById('filter-search').addEventListener('input', (e) => {
    taskFilterText = e.target.value.trim();
    renderTasks();
});
document.getElementById('filter-category').addEventListener('change', (e) => {
    taskFilterCategory = e.target.value;
    renderTasks();
});
document.getElementById('filter-status').addEventListener('change', (e) => {
    taskFilterStatus = e.target.value;
    renderTasks();
});
document.getElementById('filter-clear').addEventListener('click', () => {
    taskFilterText = '';
    taskFilterCategory = 'all';
    taskFilterStatus = 'active';
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-category').value = 'all';
    document.getElementById('filter-status').value = 'active';
    renderTasks();
});
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
document.getElementById("create-challenge").addEventListener("click", addChallenge);
document.getElementById("hof-add").addEventListener("click", addHofManual);
document.getElementById("hof-ai").addEventListener("click", addHofAI);

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
    // Normalize loot — preserve inventory plus new effect-state fields
    const loadedLoot = loaded.loot || {};
    const loot = {
        inventory:   Array.isArray(loadedLoot.inventory) ? loadedLoot.inventory : [],
        activeBoost:  loadedLoot.activeBoost  ?? null,
        streakShield: loadedLoot.streakShield ?? false,
        focusBonus:   loadedLoot.focusBonus   ?? 0,
    };
    return {
        version: STATE_VERSION,
        meta: { lastModified: meta.lastModified ?? null, lastSync: meta.lastSync ?? null, conflict: meta.conflict ?? false },
        profile: { xp: profile.xp ?? 0, level: profile.level ?? 1, xpPerTask: profile.xpPerTask ?? 20, streakDays: profile.streakDays ?? 0, lastCompletedDate: profile.lastCompletedDate ?? null },
        stats: { completionsByCategory: stats.completionsByCategory || {}, completionsByDifficulty: stats.completionsByDifficulty || {}, avgCompletionMs: stats.avgCompletionMs ?? 0, totalCompletions: stats.totalCompletions ?? 0 },
        tasks: Array.isArray(loaded.tasks) ? loaded.tasks : [],
        epics: Array.isArray(loaded.epics) ? loaded.epics : [],
        achievements: { unlocked: loaded.achievements?.unlocked || [] },
        hallOfFame: Array.isArray(loaded.hallOfFame) ? loaded.hallOfFame : [],
        publicProfile: { displayName: loaded.publicProfile?.displayName || "", tagline: loaded.publicProfile?.tagline || "", isPublic: loaded.publicProfile?.isPublic || false },
        // Feature module state — pass through from saved data, falling back to defaults
        habits:  Array.isArray(loaded.habits) ? loaded.habits : [],
        focus:   loaded.focus && Array.isArray(loaded.focus.sessions) ? loaded.focus : { sessions: [] },
        quests:  loaded.quests || { date: null, list: [] },
        boss:    loaded.boss   || { weekId: null, title: "", hp: 0, maxHp: 100, defeated: false, rewardClaimed: false },
        loot,
        mood:    Array.isArray(loaded.mood) ? loaded.mood : [],
        skills:  loaded.skills || {
            health:   { xp: 0, level: 1 },
            work:     { xp: 0, level: 1 },
            learning: { xp: 0, level: 1 },
            finance:  { xp: 0, level: 1 },
            life:     { xp: 0, level: 1 }
        },
        challenges: Array.isArray(loaded.challenges) ? loaded.challenges : []
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
    renderChallenges();
    // Feature module renders
    window.APP.renderHooks.forEach(fn => { try { fn(); } catch(e) { console.warn("render hook error", e); } });
}

function getDueDateStatus(dueDate) {
    if (!dueDate) return null;
    const today = new Date().toISOString().slice(0, 10);
    if (dueDate < today) return "overdue";
    if (dueDate === today) return "today";
    return "future";
}

function renderDueDateLabel(dueDate) {
    if (!dueDate) return "";
    const status = getDueDateStatus(dueDate);
    const formatted = new Date(dueDate + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    if (status === "overdue") {
        return `<span class="task-due-label task-due-overdue">Overdue · ${formatted}</span>`;
    } else if (status === "today") {
        return `<span class="task-due-label task-due-today">Due today · ${formatted}</span>`;
    } else {
        return `<span class="task-due-label">Due ${formatted}</span>`;
    }
}

function dueSortKey(task) {
    if (!task.dueDate) return 3;
    const status = getDueDateStatus(task.dueDate);
    if (status === "overdue") return 0;
    if (status === "today") return 1;
    return 2;
}

function renderTasks() {
    taskList.innerHTML = "";

    // Apply status filter
    let pool = state.tasks.slice();
    if (taskFilterStatus === 'active')    pool = pool.filter(t => t.status === 'active');
    else if (taskFilterStatus === 'completed') pool = pool.filter(t => t.status === 'completed');

    const totalInStatus = pool.length;

    // Apply category filter
    if (taskFilterCategory !== 'all') pool = pool.filter(t => t.category === taskFilterCategory);

    // Apply text search
    if (taskFilterText) {
        const q = taskFilterText.toLowerCase();
        pool = pool.filter(t => t.text.toLowerCase().includes(q));
    }

    // Sort active tasks by due date; completed tasks by completion time (newest first)
    if (taskFilterStatus !== 'completed') {
        pool.sort((a, b) => dueSortKey(a) - dueSortKey(b));
    }

    const visibleCount = pool.length;
    const totalAll = state.tasks.length;

    // Update count label
    const countEl = document.getElementById('filter-count');
    if (countEl) {
        const isFiltered = taskFilterText || taskFilterCategory !== 'all' || taskFilterStatus !== 'active';
        countEl.textContent = isFiltered
            ? `Showing ${visibleCount} of ${totalAll} missions`
            : `${visibleCount} mission${visibleCount !== 1 ? 's' : ''}`;
    }

    // Show/hide clear button
    const clearBtn = document.getElementById('filter-clear');
    if (clearBtn) {
        const hasActiveFilter = taskFilterText || taskFilterCategory !== 'all' || taskFilterStatus !== 'active';
        clearBtn.classList.toggle('hidden', !hasActiveFilter);
    }

    pool.forEach((task) => {
        const li = document.createElement("li");
        li.dataset.taskId = task.id;
        const isDone = task.status === 'completed';
        li.innerHTML = `
            <div class="task-content">
                <span class="task-text"${isDone ? ' style="opacity:0.5;text-decoration:line-through"' : ''}>${task.text}</span>
                <span class="task-meta">${task.category} · ${task.difficulty} · ${task.priority}</span>
                ${renderDueDateLabel(task.dueDate)}
            </div>
            <div class="task-actions">
                ${isDone ? '' : '<button class="edit-btn" title="Edit task">✎</button>'}
                ${isDone ? '' : '<button class="delete-btn" title="Mark complete">✓</button>'}
            </div>
        `;
        if (!isDone) {
            li.querySelector(".delete-btn").addEventListener("click", () => completeTask(task.id));
            li.querySelector(".edit-btn").addEventListener("click", () => startInlineEdit(task, li));
        }
        taskList.appendChild(li);
    });
}

function startInlineEdit(task, li) {
    // Prevent double-editing
    if (li.classList.contains("editing")) return;
    li.classList.add("editing");

    const contentEl = li.querySelector(".task-content");
    const textEl = li.querySelector(".task-text");
    const actionsEl = li.querySelector(".task-actions");

    const originalText = task.text;

    // Replace task text span with an input
    const input = document.createElement("input");
    input.type = "text";
    input.value = originalText;
    input.className = "task-edit-input";
    textEl.replaceWith(input);
    input.focus();
    input.select();

    // Replace action buttons with save/cancel
    actionsEl.innerHTML = `
        <button class="edit-save-btn" title="Save">✓</button>
        <button class="edit-cancel-btn" title="Cancel">✕</button>
    `;

    function saveEdit() {
        const newText = input.value.trim();
        if (newText && newText !== originalText) {
            task.text = newText;
            touchState();
            persistAndRender();
        } else {
            cancelEdit();
        }
    }

    function cancelEdit() {
        li.classList.remove("editing");
        input.replaceWith(textEl);
        actionsEl.innerHTML = `
            <button class="edit-btn" title="Edit task">✎</button>
            <button class="delete-btn" title="Mark complete">✓</button>
        `;
        actionsEl.querySelector(".delete-btn").addEventListener("click", () => completeTask(task.id));
        actionsEl.querySelector(".edit-btn").addEventListener("click", () => startInlineEdit(task, li));
    }

    actionsEl.querySelector(".edit-save-btn").addEventListener("click", saveEdit);
    actionsEl.querySelector(".edit-cancel-btn").addEventListener("click", cancelEdit);
    input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") saveEdit();
        if (e.key === "Escape") cancelEdit();
    });
}

// ─── Spaceship Progression (Three.js) ────────────────────────────────────────
const SHIPS = [
    { minLevel: 1,  name: "Rusty Pod",      build: buildShipRustyPod      },
    { minLevel: 3,  name: "Star Hopper",    build: buildShipStarHopper    },
    { minLevel: 5,  name: "Comet Rider",    build: buildShipCometRider    },
    { minLevel: 8,  name: "Nebula Cruiser", build: buildShipNebulaCruiser },
    { minLevel: 12, name: "Solar Falcon",   build: buildShipSolarFalcon   },
    { minLevel: 17, name: "Nova Striker",   build: buildShipNovaStriker   },
    { minLevel: 23, name: "Void Phantom",   build: buildShipVoidPhantom   },
    { minLevel: 30, name: "Celestial Titan",build: buildShipCelestialTitan},
];

function getShipForLevel(level) {
    let ship = SHIPS[0];
    for (const s of SHIPS) { if (level >= s.minLevel) ship = s; }
    return ship;
}

// ── shared material helpers ───────────────────────────────────────────────────
function mat(color, opts = {}) {
    return new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.6, ...opts });
}
function emissiveMat(color, emissive, intensity = 0.8) {
    return new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, roughness: 0.3, metalness: 0.5 });
}

// ── Level 1-2: Rusty Pod ──────────────────────────────────────────────────────
function buildShipRustyPod() {
    const g = new THREE.Group();
    // squished sphere body
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.55, 16, 12), mat(0x7a4020, { roughness: 0.9, metalness: 0.2 }));
    body.scale.y = 1.25;
    g.add(body);
    // porthole
    const port = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.05, 16), mat(0x1a3a4a, { roughness: 0.1, metalness: 0.9 }));
    port.rotation.x = Math.PI / 2; port.position.z = 0.5;
    g.add(port);
    // thruster
    const thr = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.28, 12), mat(0x3a2010, { roughness: 0.8 }));
    thr.position.y = -0.78;
    g.add(thr);
    // flame
    const flame = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.45, 8), emissiveMat(0xff6600, 0xff3300, 1.5));
    flame.rotation.x = Math.PI; flame.position.y = -1.12;
    g.add(flame);
    return g;
}

// ── Level 3-4: Star Hopper ────────────────────────────────────────────────────
function buildShipStarHopper() {
    const g = new THREE.Group();
    // main body cylinder
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 1.2, 14), mat(0xd0dce8, { roughness: 0.3, metalness: 0.7 }));
    g.add(body);
    // nose cone
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.6, 14), mat(0xe8f0f8, { roughness: 0.25, metalness: 0.8 }));
    nose.position.y = 0.9;
    g.add(nose);
    // 3 fins
    for (let i = 0; i < 3; i++) {
        const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.38, 0.34), mat(0xcc2233, { roughness: 0.5 }));
        const a = (i / 3) * Math.PI * 2;
        fin.position.set(Math.cos(a) * 0.44, -0.52, Math.sin(a) * 0.44);
        fin.rotation.y = -a;
        g.add(fin);
    }
    // engine glow
    const eng = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 10), emissiveMat(0x88aaff, 0x3366ff, 1.2));
    eng.rotation.x = Math.PI; eng.position.y = -0.85;
    g.add(eng);
    return g;
}

// ── Level 5-7: Comet Rider ────────────────────────────────────────────────────
function buildShipCometRider() {
    const g = new THREE.Group();
    // sleek tapered hull
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.36, 1.5, 16), mat(0x88aabb, { roughness: 0.2, metalness: 0.85 }));
    g.add(hull);
    // nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.7, 16), mat(0xaaccdd, { roughness: 0.15, metalness: 0.9 }));
    nose.position.y = 1.1;
    g.add(nose);
    // swept wings (flat boxes, angled)
    [-1, 1].forEach(side => {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.05, 0.5), mat(0x6688aa, { roughness: 0.3, metalness: 0.7 }));
        wing.position.set(side * 0.58, -0.1, 0.1);
        wing.rotation.z = side * 0.25;
        wing.rotation.y = side * -0.3;
        g.add(wing);
        // wing tip light
        const tip = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), emissiveMat(0x00ccff, 0x0088ff, 2));
        tip.position.set(side * 1.0, -0.18, 0.08);
        g.add(tip);
    });
    // twin engines
    [-0.2, 0.2].forEach(ox => {
        const eng = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 10), emissiveMat(0x44ccff, 0x0066ff, 1.4));
        eng.rotation.x = Math.PI; eng.position.set(ox, -1.08, 0);
        g.add(eng);
    });
    return g;
}

// ── Level 8-11: Nebula Cruiser ────────────────────────────────────────────────
function buildShipNebulaCruiser() {
    const g = new THREE.Group();
    // wide primary hull
    const hull = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.4, 0.32), mat(0x334455, { roughness: 0.3, metalness: 0.8 }));
    g.add(hull);
    // rounded nose cap
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), mat(0x445566, { roughness: 0.2, metalness: 0.9 }));
    nose.scale.y = 1.1; nose.position.y = 0.72;
    g.add(nose);
    // side engine pods
    [-1, 1].forEach(side => {
        const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.9, 12), mat(0x223344, { roughness: 0.35, metalness: 0.75 }));
        pod.position.set(side * 0.62, -0.15, 0);
        g.add(pod);
        // pod connector strut
        const strut = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.06), mat(0x2a3a4a));
        strut.position.set(side * 0.33, -0.1, 0);
        g.add(strut);
        // engine glow
        const eng = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.45, 10), emissiveMat(0x00aaff, 0x0055ff, 1.5));
        eng.rotation.x = Math.PI; eng.position.set(side * 0.62, -0.72, 0);
        g.add(eng);
    });
    // cockpit window
    const cockpit = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), emissiveMat(0x88ddff, 0x00aaff, 0.6));
    cockpit.scale.z = 0.5; cockpit.position.set(0, 0.5, 0.2);
    g.add(cockpit);
    return g;
}

// ── Level 12-16: Solar Falcon ─────────────────────────────────────────────────
function buildShipSolarFalcon() {
    const g = new THREE.Group();
    // delta-shaped fuselage using an extruded box
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.28, 1.6, 6), mat(0xc8a830, { roughness: 0.2, metalness: 0.9 }));
    g.add(body);
    // forward delta wings
    [-1, 1].forEach(side => {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.7), mat(0xb89020, { roughness: 0.25, metalness: 0.85 }));
        wing.position.set(side * 0.62, 0.1, 0.15);
        wing.rotation.y = side * -0.45;
        wing.rotation.z = side * 0.12;
        g.add(wing);
        // solar panel stripe
        const panel = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.02, 0.55), emissiveMat(0xffcc00, 0xff8800, 0.4));
        panel.position.set(side * 0.62, 0.12, 0.15);
        panel.rotation.y = side * -0.45;
        g.add(panel);
    });
    // nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.8, 6), mat(0xffe060, { roughness: 0.15, metalness: 0.95 }));
    nose.position.y = 1.2;
    g.add(nose);
    // triple engine blaze
    [-0.24, 0, 0.24].forEach(ox => {
        const eng = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.55, 8), emissiveMat(0xffcc00, 0xff6600, 1.6));
        eng.rotation.x = Math.PI; eng.position.set(ox, -1.0, 0);
        g.add(eng);
    });
    return g;
}

// ── Level 17-22: Nova Striker ─────────────────────────────────────────────────
function buildShipNovaStriker() {
    const g = new THREE.Group();
    // angular fuselage
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.35, 1.55, 0.28), mat(0x1a1a2e, { roughness: 0.2, metalness: 0.95 }));
    g.add(body);
    // top spine ridge
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.4, 0.1), mat(0xff3355, { roughness: 0.3, metalness: 0.7 }));
    spine.position.z = -0.15;
    g.add(spine);
    // forward swept wings
    [-1, 1].forEach(side => {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.05, 0.45), mat(0x16213e, { roughness: 0.2, metalness: 0.9 }));
        wing.position.set(side * 0.56, -0.1, 0);
        wing.rotation.y = side * 0.35;
        wing.rotation.z = side * -0.15;
        g.add(wing);
        // leading edge red stripe
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 0.06), emissiveMat(0xff2244, 0xff0033, 1.0));
        stripe.position.set(side * 0.56, -0.07, -0.2);
        stripe.rotation.y = side * 0.35;
        g.add(stripe);
    });
    // nose blade
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.9, 4), mat(0x0f0f1e, { roughness: 0.1, metalness: 1.0 }));
    nose.rotation.y = Math.PI / 4; nose.position.y = 1.22;
    g.add(nose);
    // quad engines
    [-0.22, -0.07, 0.07, 0.22].forEach(ox => {
        const eng = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.5, 8), emissiveMat(0xff4488, 0xff0066, 1.8));
        eng.rotation.x = Math.PI; eng.position.set(ox, -1.0, 0);
        g.add(eng);
    });
    return g;
}

// ── Level 23-29: Void Phantom ─────────────────────────────────────────────────
function buildShipVoidPhantom() {
    const g = new THREE.Group();
    // blended-wing stealth body
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.32, 1.7, 8), mat(0x0d0018, { roughness: 0.1, metalness: 1.0 }));
    g.add(body);
    // void aura sphere (translucent)
    const aura = new THREE.Mesh(new THREE.SphereGeometry(0.7, 20, 16), new THREE.MeshStandardMaterial({
        color: 0x6600cc, emissive: 0x330066, emissiveIntensity: 0.5,
        transparent: true, opacity: 0.12, roughness: 0.0, metalness: 0.0
    }));
    g.add(aura);
    // swept delta wings — very flat
    [-1, 1].forEach(side => {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.04, 0.6), mat(0x110022, { roughness: 0.1, metalness: 1.0 }));
        wing.position.set(side * 0.62, 0.05, 0.12);
        wing.rotation.y = side * -0.5;
        g.add(wing);
        // violet edge glow
        const glow = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.03, 0.04), emissiveMat(0xaa44ff, 0x8800ff, 1.5));
        glow.position.set(side * 0.62, 0.05, -0.06);
        glow.rotation.y = side * -0.5;
        g.add(glow);
    });
    // glowing eye cockpit
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), emissiveMat(0xee88ff, 0xcc44ff, 2.0));
    eye.position.set(0, 0.42, 0.16);
    g.add(eye);
    // twin purple exhausts
    [-0.18, 0.18].forEach(ox => {
        const eng = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.65, 8), emissiveMat(0xcc44ff, 0x8800cc, 2.0));
        eng.rotation.x = Math.PI; eng.position.set(ox, -1.05, 0);
        g.add(eng);
    });
    return g;
}

// ── Level 30+: Celestial Titan ────────────────────────────────────────────────
function buildShipCelestialTitan() {
    const g = new THREE.Group();
    // massive golden hull
    const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.48, 1.8, 16), mat(0xc87800, { roughness: 0.15, metalness: 1.0 }));
    g.add(hull);
    // golden aura
    const aura = new THREE.Mesh(new THREE.SphereGeometry(0.88, 20, 16), new THREE.MeshStandardMaterial({
        color: 0xffcc00, emissive: 0xff8800, emissiveIntensity: 0.3,
        transparent: true, opacity: 0.10, roughness: 0.0
    }));
    g.add(aura);
    // outer ornate wings
    [-1, 1].forEach(side => {
        const outerWing = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.65), mat(0xffd700, { roughness: 0.12, metalness: 1.0 }));
        outerWing.position.set(side * 0.72, -0.05, 0);
        outerWing.rotation.z = side * 0.18;
        g.add(outerWing);
        // wing surface filigree
        const filigree = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.04, 0.08), emissiveMat(0xffee80, 0xffcc00, 0.8));
        filigree.position.set(side * 0.72, -0.01, -0.22);
        filigree.rotation.z = side * 0.18;
        g.add(filigree);
        // inner secondary wings
        const innerWing = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.05, 0.4), mat(0xb87000, { roughness: 0.18, metalness: 0.95 }));
        innerWing.position.set(side * 0.36, 0.3, 0.05);
        innerWing.rotation.z = side * -0.25;
        g.add(innerWing);
    });
    // gleaming nose
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.95, 16), mat(0xffe060, { roughness: 0.1, metalness: 1.0 }));
    nose.position.y = 1.38;
    g.add(nose);
    // gem cockpit
    const gem = new THREE.Mesh(new THREE.SphereGeometry(0.14, 14, 12), emissiveMat(0xffffff, 0xffee88, 1.6));
    gem.position.set(0, 0.72, 0.28);
    g.add(gem);
    // quad gold engine blazes
    [-0.3, -0.1, 0.1, 0.3].forEach(ox => {
        const eng = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.6, 8), emissiveMat(0xffee60, 0xff8800, 2.0));
        eng.rotation.x = Math.PI; eng.position.set(ox, -1.15, 0);
        g.add(eng);
    });
    return g;
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

// ─── Living Orb — Three.js (Dashboard Hero) ───────────────────────────────────
let _orbRenderer = null;
function initOrb() {
    const canvas = document.getElementById('orb-canvas');
    if (!canvas || !window.THREE) return;
    if (_orbRenderer) { _orbRenderer.dispose(); _orbRenderer = null; }

    // Fixed render resolution — CSS transitions the visual size, Three.js stays stable
    const RES = 560;
    canvas.width  = RES;
    canvas.height = RES;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    _orbRenderer = renderer;
    renderer.setPixelRatio(1); // already high res at 560px
    renderer.setSize(RES, RES);
    renderer.setClearColor(0x000000, 0);

    const scene  = new THREE.Scene();
    // Wider FOV + farther camera so rings never clip
    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 100);
    camera.position.z = 4.2;

    scene.add(new THREE.AmbientLight(0xffffff, 0.15));
    const keyLight = new THREE.PointLight(0xaaccff, 2.0, 14);
    keyLight.position.set(-2, 2.5, 3);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0xff6520, 1.4, 12);
    rimLight.position.set(2, -2, -2);
    scene.add(rimLight);

    const orbGroup = new THREE.Group();
    scene.add(orbGroup);

    // ── shader with accent color uniform ─────────────────────────────────────
    const vertexShader = `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
            vNormal   = normalize(normalMatrix * normal);
            vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;
    const fragmentShader = `
        uniform float uTime;
        uniform vec3  uAccent;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
            vec3 viewDir = normalize(cameraPosition - vPosition);
            float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.2);

            float n1 = sin(vPosition.x * 3.1 + uTime * 0.38) * sin(vPosition.y * 2.6 - uTime * 0.28) * 0.5 + 0.5;
            float n2 = sin(vPosition.y * 2.9 + uTime * 0.22) * sin(vPosition.z * 3.3 - uTime * 0.32) * 0.5 + 0.5;
            float n3 = sin(vPosition.z * 2.3 + uTime * 0.18) * sin(vPosition.x * 3.6 + uTime * 0.26) * 0.5 + 0.5;
            float n4 = sin(vPosition.x * 1.8 - uTime * 0.14) * sin(vPosition.z * 2.1 + uTime * 0.20) * 0.5 + 0.5;

            vec3 purple = vec3(0.49, 0.23, 0.93);
            vec3 cyan   = vec3(0.10, 0.75, 1.00);
            vec3 orange = vec3(1.00, 0.40, 0.12);
            vec3 dark   = vec3(0.04, 0.01, 0.10);

            vec3 col = mix(dark,   purple,  n1 * 0.88);
            col = mix(col, cyan,   n2 * 0.46);
            col = mix(col, orange, n3 * 0.36);
            col = mix(col, uAccent, n4 * 0.42);  // page accent bleeds in

            col += fresnel * (vec3(0.55, 0.25, 1.0) + uAccent * 0.4) * 1.4;

            vec3 lightDir = normalize(vec3(-0.6, 0.8, 0.9));
            float spec = pow(max(dot(reflect(-lightDir, vNormal), viewDir), 0.0), 42.0);
            col += spec * vec3(0.9, 0.8, 1.0) * 0.55;

            gl_FragColor = vec4(col, 0.92 + fresnel * 0.08);
        }
    `;

    const uTime   = { value: 0 };
    const uAccent = { value: new THREE.Vector3(1.0, 0.40, 0.12) }; // start orange

    const orbMesh = new THREE.Mesh(
        new THREE.SphereGeometry(1.0, 64, 48),
        new THREE.ShaderMaterial({ vertexShader, fragmentShader,
            uniforms: { uTime, uAccent }, transparent: true })
    );
    orbGroup.add(orbMesh);

    // ── orbital rings ─────────────────────────────────────────────────────────
    const ringDefs = [
        { r: 1.38, tube: 0.013, color: 0xff6520, opacity: 0.65, tiltX: 1.1,  tiltZ: 0.3  },
        { r: 1.62, tube: 0.009, color: 0xaa66ff, opacity: 0.45, tiltX: -0.6, tiltZ: 0.8  },
    ];
    const rings = ringDefs.map(({ r, tube, color, opacity, tiltX, tiltZ }) => {
        const mesh = new THREE.Mesh(
            new THREE.TorusGeometry(r, tube, 8, 80),
            new THREE.MeshBasicMaterial({ color, transparent: true, opacity })
        );
        mesh.rotation.x = tiltX;
        mesh.rotation.z = tiltZ;
        orbGroup.add(mesh);
        return mesh;
    });

    // ── orbiting particles ────────────────────────────────────────────────────
    const particleDefs = [
        { r: 1.38, speed: 0.012, phase: 0,    tiltX: 1.1,  tiltZ: 0.3,  color: 0xff6520, size: 0.060 },
        { r: 1.38, speed: 0.012, phase: 3.14, tiltX: 1.1,  tiltZ: 0.3,  color: 0xff9a50, size: 0.038 },
        { r: 1.62, speed: -0.008,phase: 1.0,  tiltX: -0.6, tiltZ: 0.8,  color: 0xcc88ff, size: 0.044 },
        { r: 1.62, speed: -0.008,phase: 4.2,  tiltX: -0.6, tiltZ: 0.8,  color: 0x9944ff, size: 0.030 },
        { r: 1.48, speed: 0.010, phase: 2.0,  tiltX: 0.4,  tiltZ: -0.5, color: 0xff7a30, size: 0.046 },
    ];
    const particleMeshes = particleDefs.map(({ color, size, tiltX, tiltZ }) => {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(size, 8, 8),
            new THREE.MeshBasicMaterial({ color })
        );
        mesh.userData.ring = new THREE.Object3D();
        mesh.userData.ring.rotation.x = tiltX;
        mesh.userData.ring.rotation.z = tiltZ;
        orbGroup.add(mesh.userData.ring);
        return mesh;
    });

    // ── mouse tracking ────────────────────────────────────────────────────────
    let targetRX = 0, targetRY = 0, currentRX = 0, currentRY = 0;
    window.addEventListener('mousemove', e => {
        const r = canvas.getBoundingClientRect();
        targetRY = ((e.clientX - r.left) / RES - 0.5) * 0.8;
        targetRX = ((e.clientY - r.top)  / RES - 0.5) * -0.5;
    });

    // ── transition state ──────────────────────────────────────────────────────
    let speedMult  = 1.0;   // spikes to 4 on page switch, decays back
    let scalePulse = 1.0;   // spikes to 1.12, decays back
    let accentTarget = new THREE.Vector3(1.0, 0.40, 0.12);

    // ── page shape system — organic blob morphing ─────────────────────────────
    // Each page gets a unique blob "personality" via wave frequency/amplitude params.
    // All shapes are organic wireframe sphere morphs — no set geometric forms.
    const PAGE_BLOB_PARAMS = {
        tasks:         { f1: 2.2, f2: 1.6, f3: 2.8, s1: 0.011, s2: 0.009, s3: 0.012, amp: 0.30, rotY: 0.005 },
        habits:        { f1: 1.4, f2: 2.0, f3: 1.2, s1: 0.007, s2: 0.010, s3: 0.008, amp: 0.22, rotY: 0.003 },
        quests:        { f1: 3.0, f2: 2.4, f3: 1.8, s1: 0.013, s2: 0.011, s3: 0.014, amp: 0.38, rotY: 0.006 },
        epics:         { f1: 1.8, f2: 1.2, f3: 2.2, s1: 0.009, s2: 0.007, s3: 0.010, amp: 0.45, rotY: 0.004 },
        'focus-timer': { f1: 1.2, f2: 0.9, f3: 1.4, s1: 0.005, s2: 0.007, s3: 0.006, amp: 0.18, rotY: 0.002 },
        focus:         { f1: 1.2, f2: 0.9, f3: 1.4, s1: 0.005, s2: 0.007, s3: 0.006, amp: 0.18, rotY: 0.002 },
        mood:          { f1: 2.8, f2: 2.2, f3: 3.2, s1: 0.015, s2: 0.012, s3: 0.013, amp: 0.28, rotY: 0.004 },
        skills:        { f1: 4.0, f2: 3.0, f3: 3.5, s1: 0.010, s2: 0.012, s3: 0.011, amp: 0.25, rotY: 0.005 },
        achievements:  { f1: 2.0, f2: 3.5, f3: 2.5, s1: 0.014, s2: 0.016, s3: 0.012, amp: 0.40, rotY: 0.008 },
        profile:       { f1: 1.5, f2: 1.8, f3: 1.3, s1: 0.006, s2: 0.008, s3: 0.007, amp: 0.18, rotY: 0.003 },
        roadmap:       { f1: 2.5, f2: 1.5, f3: 3.0, s1: 0.010, s2: 0.008, s3: 0.012, amp: 0.35, rotY: 0.004 },
        loot:          { f1: 3.5, f2: 2.8, f3: 4.0, s1: 0.013, s2: 0.015, s3: 0.014, amp: 0.32, rotY: 0.007 },
    };

    let activeShape = null; // { group, update(t, speed) }

    function clearShape() {
        if (activeShape) { scene.remove(activeShape.group); activeShape = null; }
    }

    // Organic blob: multi-layer sphere with cross-coupled sine displacement.
    // Cross-coupling (e.g. ox*f1 + oy*f2*0.4) prevents separable wave patterns,
    // making the surface look alive rather than like a simple standing wave.
    function buildOrganicBlob(color, params) {
        const { f1=2.0, f2=1.8, f3=1.6, s1=0.011, s2=0.009, s3=0.010, amp=0.28, rotY=0.004 } = params;
        const group  = new THREE.Group();
        // Three nested layers: primary, inner, outer ghost
        const layerDefs = [
            { r: 1.3,  segs: 48, op: 0.30, tOff:   0, xOff:  0.0, aM: 1.00 },
            { r: 0.92, segs: 32, op: 0.20, tOff: 150, xOff:  0.6, aM: 0.65 },
            { r: 1.72, segs: 22, op: 0.10, tOff: -80, xOff: -0.4, aM: 0.45 },
        ];
        const meshes = [];
        for (const ld of layerDefs) {
            const geo  = new THREE.SphereGeometry(ld.r, ld.segs, Math.round(ld.segs * 0.65));
            const mat  = new THREE.MeshBasicMaterial({ color, wireframe: true, transparent: true, opacity: ld.op, depthWrite: false });
            const mesh = new THREE.Mesh(geo, mat);
            const orig = Float32Array.from(geo.attributes.position.array);
            meshes.push({ geo, orig, tOff: ld.tOff, xOff: ld.xOff, aM: ld.aM });
            group.add(mesh);
        }
        group.scale.setScalar(0.82);
        return { group, update(t, sp) {
            for (const { geo, orig, tOff, xOff, aM } of meshes) {
                const pos = geo.attributes.position.array;
                const tt  = t + tOff;
                for (let i = 0; i < pos.length; i += 3) {
                    const ox = orig[i], oy = orig[i+1], oz = orig[i+2];
                    const len = Math.sqrt(ox*ox + oy*oy + oz*oz) || 1;
                    const w1 = Math.sin(ox * f1 + tt * s1 * sp + oy * f2 * 0.4 + xOff);
                    const w2 = Math.cos(oy * f2 + tt * s2 * sp + oz * f3 * 0.35);
                    const w3 = Math.sin(oz * f3 + tt * s3 * sp + ox * f1 * 0.3);
                    const d  = amp * aM * (w1 * w2 * 0.7 + w3 * 0.3);
                    const s  = (1 + d) / len;
                    pos[i] = ox * s; pos[i+1] = oy * s; pos[i+2] = oz * s;
                }
                geo.attributes.position.needsUpdate = true;
            }
            group.rotation.y += rotY * sp;
            group.rotation.x  = Math.sin(t * 0.003) * 0.35;
            group.rotation.z  = Math.cos(t * 0.0023) * 0.18;
        }};
    }

    window.APP.orbTransition = function(r, g, b) {
        accentTarget.set(r / 255, g / 255, b / 255);
        speedMult  = 4.0;
        scalePulse = 1.12;
    };

    window.APP.setOrbShape = function(page, r, g, b) {
        accentTarget.set(r / 255, g / 255, b / 255);
        speedMult  = 3.5;
        scalePulse = 1.1;
        if (page === 'dashboard') {
            clearShape();
            orbGroup.visible = true;
        } else {
            orbGroup.visible = false;
            clearShape();
            const params = PAGE_BLOB_PARAMS[page] || {};
            const color  = new THREE.Color(r / 255, g / 255, b / 255);
            activeShape  = buildOrganicBlob(color, params);
            scene.add(activeShape.group);
        }
    };

    // ── animate ───────────────────────────────────────────────────────────────
    let t = 0;
    function animate() {
        requestAnimationFrame(animate);

        // decay transition values
        speedMult  += (1.0 - speedMult)  * 0.06;
        scalePulse += (1.0 - scalePulse) * 0.08;
        uAccent.value.lerp(accentTarget, 0.04);

        uTime.value = t * 0.016;

        if (orbGroup.visible) {
            currentRX += (targetRX - currentRX) * 0.04;
            currentRY += (targetRY - currentRY) * 0.04;
            orbGroup.rotation.x = currentRX;
            orbGroup.rotation.y = currentRY + t * 0.004 * speedMult;
            orbGroup.scale.setScalar(scalePulse);

            rings[0].rotation.z += 0.004 * speedMult;
            rings[1].rotation.z -= 0.003 * speedMult;

            particleDefs.forEach((def, i) => {
                const angle = t * def.speed * speedMult + def.phase;
                const mesh  = particleMeshes[i];
                const ring  = mesh.userData.ring;
                const local = new THREE.Vector3(Math.cos(angle) * def.r, 0, Math.sin(angle) * def.r);
                local.applyEuler(ring.rotation);
                mesh.position.copy(local);
                if (!mesh.parent) orbGroup.add(mesh);
            });
        }

        if (activeShape) activeShape.update(t, speedMult);

        renderer.render(scene, camera);
        t++;
    }
    animate();
}

// ─── Ship Renderer (Three.js) ────────────────────────────────────────────────
let _shipThreeRenderer = null;
let _shipThreeScene    = null;
let _shipThreeCamera   = null;
let _shipCurrentGroup  = null;

function renderShip(level) {
    const canvas = document.getElementById('spaceship-canvas');
    const nameEl = document.getElementById('ship-name');
    if (!canvas || !window.THREE) return;

    const ship = getShipForLevel(level);
    if (nameEl) nameEl.textContent = ship.name;

    // Create renderer once
    if (!_shipThreeRenderer) {
        _shipThreeRenderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        _shipThreeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        _shipThreeRenderer.setClearColor(0x000000, 0);
        _shipThreeRenderer.setSize(canvas.width, canvas.height);

        _shipThreeScene  = new THREE.Scene();
        _shipThreeCamera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
        _shipThreeCamera.position.set(0, 0.4, 3.8);
        _shipThreeCamera.lookAt(0, 0, 0);

        _shipThreeScene.add(new THREE.AmbientLight(0xffffff, 0.5));
        const key = new THREE.PointLight(0xaaddff, 3.0, 20);
        key.position.set(-2, 3, 3);
        _shipThreeScene.add(key);
        const fill = new THREE.PointLight(0xffeedd, 1.2, 15);
        fill.position.set(2, -1, 2);
        _shipThreeScene.add(fill);
        const back = new THREE.PointLight(0x8844ff, 1.5, 12);
        back.position.set(0, -2, -3);
        _shipThreeScene.add(back);
    }

    // Swap ship mesh
    if (_shipCurrentGroup) {
        _shipThreeScene.remove(_shipCurrentGroup);
        _shipCurrentGroup.traverse(obj => {
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });
    }
    _shipCurrentGroup = ship.build();
    _shipThreeScene.add(_shipCurrentGroup);

    // Animate
    let t = 0;
    function frame() {
        _shipCurrentGroup.rotation.y = t * 0.012;
        _shipCurrentGroup.position.y = Math.sin(t * 0.04) * 0.06;
        _shipThreeRenderer.render(_shipThreeScene, _shipThreeCamera);
        t++;
        requestAnimationFrame(frame);
    }
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

// ─── Mood Insights ────────────────────────────────────────────────────────────
function getMoodInsights(appState) {
    const entries = Array.isArray(appState.mood) ? appState.mood : [];
    if (entries.length === 0) {
        return ["Log your mood daily to unlock energy insights."];
    }

    // Sort ascending by date, take last 14 entries
    const sorted = [...entries]
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-14);

    if (sorted.length < 2) {
        return ["Keep checking in — more data unlocks personalised energy insights."];
    }

    const insights = [];

    // ── Insight 1: energy trend over last 7 days ──────────────────────────────
    const last7 = sorted.slice(-7);
    if (last7.length >= 3) {
        const avg7 = last7.reduce((s, e) => s + e.energy, 0) / last7.length;

        // Split into first half / second half to detect trend direction
        const half = Math.floor(last7.length / 2);
        const firstHalf  = last7.slice(0, half);
        const secondHalf = last7.slice(-half);
        const avgFirst  = firstHalf.reduce((s, e) => s + e.energy, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((s, e) => s + e.energy, 0) / secondHalf.length;
        const delta = avgSecond - avgFirst;

        if (avg7 >= 4) {
            insights.push("Your energy has been high this week — great time to tackle hard tasks.");
        } else if (avg7 <= 2) {
            insights.push("Energy has been low this week — consider a lighter workload or a rest day.");
        } else if (delta >= 0.6) {
            insights.push("Mood trending up over the last 7 days — keep the momentum going.");
        } else if (delta <= -0.6) {
            insights.push("Mood trending down over the last 7 days — consider taking a break.");
        } else {
            insights.push(`Your average energy this week is ${avg7.toFixed(1)}/5 — steady and consistent.`);
        }
    }

    // ── Insight 2: best days of the week ─────────────────────────────────────
    const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayTotals = {};
    const dayCounts = {};
    sorted.forEach(e => {
        const [year, month, day] = e.date.split('-').map(Number);
        const dow = new Date(year, month - 1, day).getDay();
        dayTotals[dow] = (dayTotals[dow] || 0) + e.energy;
        dayCounts[dow] = (dayCounts[dow] || 0) + 1;
    });

    // Only consider days with at least 2 data points
    const dayAvgs = Object.keys(dayCounts)
        .filter(d => dayCounts[d] >= 2)
        .map(d => ({ dow: Number(d), avg: dayTotals[d] / dayCounts[d] }))
        .sort((a, b) => b.avg - a.avg);

    if (dayAvgs.length >= 2) {
        const best = dayAvgs.slice(0, 2).map(d => DAY_NAMES[d.dow]);
        insights.push(`Your best days: ${best.join(" & ")} — schedule important tasks then.`);
    } else if (dayAvgs.length === 1 && dayAvgs[0].avg >= 3.5) {
        insights.push(`Your best day: ${DAY_NAMES[dayAvgs[0].dow]} — schedule important tasks then.`);
    }

    // ── Insight 3: task completion correlation with high energy ───────────────
    // We need at least 5 paired data points (mood entry + tasks completed that day)
    const completedTasks = (appState.tasks || []).filter(t => t.status === "completed" && t.completedAt);
    if (completedTasks.length > 0 && sorted.length >= 5) {
        // Count completions per date string
        const tasksByDate = {};
        completedTasks.forEach(t => {
            const d = new Date(t.completedAt).toISOString().slice(0, 10);
            tasksByDate[d] = (tasksByDate[d] || 0) + 1;
        });

        // Pair mood entries that have completion data
        const paired = sorted.filter(e => tasksByDate[e.date] !== undefined);
        if (paired.length >= 3) {
            const highEnergy = paired.filter(e => e.energy >= 4);
            const lowEnergy  = paired.filter(e => e.energy <= 2);
            if (highEnergy.length >= 2 && lowEnergy.length >= 2) {
                const avgHigh = highEnergy.reduce((s, e) => s + tasksByDate[e.date], 0) / highEnergy.length;
                const avgLow  = lowEnergy.reduce((s, e)  => s + tasksByDate[e.date], 0) / lowEnergy.length;
                if (avgLow > 0 && avgHigh / avgLow >= 1.5) {
                    const multiplier = (avgHigh / avgLow).toFixed(1);
                    insights.push(`You complete ${multiplier}x more tasks on high-energy days — energy is your superpower.`);
                }
            }
        }
    }

    // Return at most 2 insights to keep the card concise
    return insights.slice(0, 2);
}

// ─── Insights Engine ──────────────────────────────────────────────────────────
// Returns an array of insight objects: { type, emoji, message }
// type is one of: "warning" | "positive" | "info"
function computeInsights(s) {
    const insights = [];
    const today = new Date().toISOString().slice(0, 10);
    const DAY_NAMES = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

    // ── Empty state ───────────────────────────────────────────────────────────
    const allTasks = Array.isArray(s.tasks) ? s.tasks : [];
    if (allTasks.length === 0) {
        insights.push({ type: "info", emoji: "🚀", message: "Add your first mission to get started!" });
        return insights;
    }

    // ── Streak risk ───────────────────────────────────────────────────────────
    const streak = s.profile ? (s.profile.streakDays || 0) : 0;
    if (streak > 0) {
        const completedTasks = allTasks.filter(t => t.status === "completed" && t.completedAt);
        const completedToday = completedTasks.some(t => t.completedAt.slice(0, 10) === today);
        if (!completedToday) {
            insights.push({
                type: "warning",
                emoji: "⚠️",
                message: `Your ${streak}-day streak is at risk — complete a task today!`
            });
        }
    }

    // ── XP velocity (this week vs last week) ─────────────────────────────────
    const completedWithXp = allTasks.filter(t => t.status === "completed" && t.completedAt && t.xpValue);
    if (completedWithXp.length >= 2) {
        const now = new Date();
        // Start of this week (Monday)
        const startOfThisWeek = new Date(now);
        startOfThisWeek.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        startOfThisWeek.setHours(0, 0, 0, 0);
        const startOfLastWeek = new Date(startOfThisWeek);
        startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

        let thisWeekXp = 0;
        let lastWeekXp = 0;
        completedWithXp.forEach(t => {
            const d = new Date(t.completedAt);
            if (d >= startOfThisWeek) thisWeekXp += t.xpValue;
            else if (d >= startOfLastWeek) lastWeekXp += t.xpValue;
        });

        if (lastWeekXp > 0 && thisWeekXp > 0) {
            const pct = Math.round(((thisWeekXp - lastWeekXp) / lastWeekXp) * 100);
            if (pct >= 10) {
                insights.push({ type: "positive", emoji: "📈", message: `You earned ${pct}% more XP this week than last — great momentum!` });
            } else if (pct <= -10) {
                insights.push({ type: "warning", emoji: "📉", message: `XP slowing down — push through and complete more missions!` });
            }
        } else if (thisWeekXp > 0 && lastWeekXp === 0) {
            insights.push({ type: "positive", emoji: "📈", message: `Great start this week — you've earned ${thisWeekXp} XP so far!` });
        }
    }

    // ── Skill imbalance ───────────────────────────────────────────────────────
    const skills = s.skills || {};
    const skillEntries = Object.entries(skills); // [ [name, {xp, level}] ]
    if (skillEntries.length >= 2) {
        const levels = skillEntries.map(([, sk]) => sk.level || 1);
        const maxLevel = Math.max(...levels);
        const minLevel = Math.min(...levels);
        if (maxLevel - minLevel >= 2) {
            const leadSkill = skillEntries.find(([, sk]) => (sk.level || 1) === maxLevel);
            const lagSkill  = skillEntries.find(([, sk]) => (sk.level || 1) === minLevel);
            const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);
            insights.push({
                type: "info",
                emoji: "⚖️",
                message: `Your ${capitalize(leadSkill[0])} skill is racing ahead (Lv ${maxLevel}) — don't neglect ${capitalize(lagSkill[0])} (Lv ${minLevel})`
            });
        }
    }

    // ── Habit consistency ─────────────────────────────────────────────────────
    const habits = Array.isArray(s.habits) ? s.habits : [];
    if (habits.length > 0) {
        const doneToday = habits.filter(h =>
            Array.isArray(h.completedDates) && h.completedDates.includes(today)
        ).length;
        const total = habits.length;
        if (doneToday === total) {
            insights.push({ type: "positive", emoji: "💪", message: `All ${total} habit${total > 1 ? "s" : ""} done today — keep it up!` });
        } else {
            insights.push({ type: "info", emoji: "✅", message: `You've completed ${doneToday}/${total} habits today — keep going!` });
        }
    }

    // ── Productive day pattern ────────────────────────────────────────────────
    const completedWithDate = allTasks.filter(t => t.status === "completed" && t.completedAt);
    if (completedWithDate.length >= 5) {
        const dowCounts = {};
        completedWithDate.forEach(t => {
            const d = new Date(t.completedAt);
            const dow = d.getDay();
            dowCounts[dow] = (dowCounts[dow] || 0) + 1;
        });
        const bestDow = Object.entries(dowCounts).sort((a, b) => b[1] - a[1])[0];
        if (bestDow) {
            insights.push({
                type: "info",
                emoji: "📅",
                message: `You're most productive on ${DAY_NAMES[Number(bestDow[0])]}s — schedule your hardest tasks then!`
            });
        }
    }

    // ── Level up proximity ────────────────────────────────────────────────────
    const xp = s.profile ? (s.profile.xp || 0) : 0;
    const level = s.profile ? (s.profile.level || 1) : 1;
    const xpRemaining = 100 - xp;
    if (xpRemaining <= 20 && xpRemaining > 0) {
        insights.push({
            type: "positive",
            emoji: "⚡",
            message: `You're ${xpRemaining} XP away from Level ${level + 1} — almost there!`
        });
    }

    // ── Mood / energy insight (first one from getMoodInsights) ────────────────
    const moodLines = getMoodInsights(s);
    if (moodLines.length > 0 && !moodLines[0].startsWith("Log your mood")) {
        insights.push({ type: "info", emoji: "🧠", message: moodLines[0] });
    }

    return insights.slice(0, 5);
}

function renderInsights() {
    const cards = computeInsights(state);
    const container = document.getElementById("insight-cards-container");
    if (!container) return;

    container.innerHTML = cards.map(insight => `
        <div class="insight-card type-${insight.type}">
            <span class="insight-card-emoji">${insight.emoji}</span>
            <span class="insight-card-text">${insight.message}</span>
        </div>
    `).join("");
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
        const isUnlocked = unlocked.has(ach.id);
        const tier = ach.tier || "bronze";
        const card = document.createElement("div");
        card.className = `achievement-card tier-${tier}${isUnlocked ? "" : " locked"}`;
        card.innerHTML = `
            <div class="achievement-tier-badges">
                <span class="badge badge-tier-${tier}">${tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
                <span class="badge${isUnlocked ? " badge-unlocked" : " badge-locked"}">${isUnlocked ? "✓ Unlocked" : "Locked"}</span>
            </div>
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
        const rarityKey = (token.rarity || "Common").toLowerCase();
        const card = document.createElement("div");
        card.className = `hall-card rarity-${rarityKey}`;
        card.innerHTML = `
            <span class="badge badge-${rarityKey}">${token.rarity}</span>
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
        xpValue: calcTaskXp(difficultySelect.value, prioritySelect.value),
        dueDate: taskDueInput.value || null
    };
    state.tasks.push(task);
    taskInput.value = "";
    taskDueInput.value = "";
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

    // Apply XP boost if one is active
    let xpAmount = task.xpValue;
    if (state.loot?.activeBoost?.type === 'xp2x') {
        xpAmount = xpAmount * 2;
        state.loot.activeBoost = null; // consume after one task
    }
    gainXP(xpAmount);

    checkAchievements();
    checkChallenges();
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
    // Remove any existing suggestion panel
    const existing = document.getElementById("ai-plan-panel");
    if (existing) { existing.remove(); return; }

    // Determine source title: prefer selected epic, fall back to epic input
    let title = "";
    let sourceEpicId = selectedEpicId;
    if (sourceEpicId) {
        const sel = state.epics.find((e) => e.id === sourceEpicId);
        if (sel) title = sel.title;
    }
    if (!title) title = epicInput.value.trim();
    if (!title) {
        epicHint.innerText = "Type an epic name or select an epic first, then click AI Plan.";
        return;
    }

    // Keyword → project type mapping
    const RULES = [
        {
            keys: ["fitness","workout","gym","health","run","running","exercise","training"],
            subtasks: [
                "Set weekly schedule",
                "Track starting metrics",
                "Research proper form",
                "Find accountability partner",
                "Set 30-day milestone goal",
                "Prepare equipment/gear"
            ]
        },
        {
            keys: ["learn","study","course","skill","book","read","reading","tutorial"],
            subtasks: [
                "Define learning objectives",
                "Gather resources and materials",
                "Create study schedule",
                "Take notes and summarize",
                "Practice with exercises",
                "Test understanding with project"
            ]
        },
        {
            keys: ["build","create","develop","app","website","project","code","coding","software"],
            subtasks: [
                "Define requirements and scope",
                "Design architecture/wireframe",
                "Set up development environment",
                "Build core functionality",
                "Test and debug",
                "Deploy and document"
            ]
        },
        {
            keys: ["business","launch","startup","product","market","marketing","monetize","sell"],
            subtasks: [
                "Validate the idea with research",
                "Define target audience",
                "Create MVP plan",
                "Set revenue/growth goals",
                "Plan marketing strategy",
                "Set launch date milestone"
            ]
        },
        {
            keys: ["write","blog","book","essay","content","writing","article","novel"],
            subtasks: [
                "Outline structure and key points",
                "Research and gather sources",
                "Write first draft",
                "Edit and revise",
                "Get feedback from others",
                "Finalize and publish"
            ]
        },
        {
            keys: ["move","relocate","travel","trip","vacation","journey"],
            subtasks: [
                "Research destination/location",
                "Create budget and timeline",
                "Handle logistics and booking",
                "Prepare checklist of tasks",
                "Notify relevant parties",
                "Plan arrival/settlement steps"
            ]
        }
    ];

    const DEFAULT_SUBTASKS = [
        "Define the goal clearly",
        "Break into first milestones",
        "Identify potential obstacles",
        "Gather required resources",
        "Set a timeline",
        "Define success criteria"
    ];

    // Match keywords
    const lower = title.toLowerCase();
    let suggestions = DEFAULT_SUBTASKS;
    for (const rule of RULES) {
        if (rule.keys.some((k) => lower.includes(k))) {
            suggestions = rule.subtasks;
            break;
        }
    }

    // Build the panel
    const panel = document.createElement("div");
    panel.id = "ai-plan-panel";
    panel.className = "ai-plan-panel";

    const heading = document.createElement("div");
    heading.className = "ai-plan-heading";
    heading.innerHTML = `<span class="ai-plan-title">✦ Suggested Subtasks</span><span class="ai-plan-for">for &ldquo;${title}&rdquo;</span>`;
    panel.appendChild(heading);

    const list = document.createElement("div");
    list.className = "ai-plan-list";
    suggestions.forEach((text) => {
        const item = document.createElement("label");
        item.className = "ai-plan-item";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = true;
        cb.value = text;
        const span = document.createElement("span");
        span.textContent = text;
        item.appendChild(cb);
        item.appendChild(span);
        list.appendChild(item);
    });
    panel.appendChild(list);

    const footer = document.createElement("div");
    footer.className = "ai-plan-footer";

    const addBtn = document.createElement("button");
    addBtn.className = "btn-primary";
    addBtn.textContent = "Add Selected";
    addBtn.addEventListener("click", () => {
        const checked = [...list.querySelectorAll("input[type=checkbox]:checked")];
        if (!checked.length) { panel.remove(); return; }

        // If no epic is selected, try to create one from epicInput first
        let targetId = sourceEpicId;
        if (!targetId) {
            const newTitle = epicInput.value.trim();
            if (!newTitle) {
                epicHint.innerText = "Select or create an epic first.";
                return;
            }
            // Create a new epic inline
            const newEpic = {
                id: `epic_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                title: newTitle,
                subtasks: [],
                createdAt: new Date().toISOString(),
                completedAt: null
            };
            state.epics.push(newEpic);
            selectedEpicId = newEpic.id;
            targetId = newEpic.id;
            epicInput.value = "";
        }

        const epic = state.epics.find((e) => e.id === targetId);
        if (!epic) return;

        checked.forEach((cb) => {
            epic.subtasks.push({
                id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
                text: cb.value,
                completed: false
            });
        });

        epicHint.innerText = `Added ${checked.length} subtask${checked.length > 1 ? "s" : ""} to "${epic.title}".`;
        touchState();
        persistAndRender();
        panel.remove();
    });

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "btn-ghost";
    cancelBtn.textContent = "Cancel";
    cancelBtn.addEventListener("click", () => panel.remove());

    footer.appendChild(addBtn);
    footer.appendChild(cancelBtn);
    panel.appendChild(footer);

    // Insert the panel right after the plan button's parent input-row
    planEpicBtn.closest(".input-row").insertAdjacentElement("afterend", panel);
}

function addHallToken(epic) {
    state.hallOfFame.push(generateAchievementToken(epic));
    touchState();
    persistAndRender();
}

function addHofManual() {
    const text = document.getElementById("hof-input").value.trim();
    if (!text) return;
    state.hallOfFame.push(generateManualToken(text));
    document.getElementById("hof-input").value = "";
    touchState();
    persistAndRender();
}

function addHofAI() {
    const btn = document.getElementById("hof-ai");
    const token = generateAIToken();
    state.hallOfFame.push(token);
    touchState();
    persistAndRender();
    // Brief confirmation feedback on the button
    const original = btn.textContent;
    btn.textContent = "✓ Token minted!";
    btn.disabled = true;
    setTimeout(() => {
        btn.textContent = original;
        btn.disabled = false;
    }, 2000);
}

function generateAIToken() {
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

    const level       = state.profile.level      ?? 1;
    const streak      = state.profile.streakDays ?? 0;
    const xp          = state.profile.xp         ?? 0;
    const completions = state.stats.totalCompletions ?? 0;
    const focusSessions = (state.focus && Array.isArray(state.focus.sessions))
        ? state.focus.sessions.length : 0;
    const completedEpics = state.epics.filter((e) => e.completedAt).length;

    // Find highest-level skill
    const skillEntries = Object.entries(state.skills || {});
    let topSkillName = null;
    let topSkillLevel = 0;
    for (const [name, sk] of skillEntries) {
        if ((sk.level ?? 1) > topSkillLevel) {
            topSkillLevel = sk.level ?? 1;
            topSkillName  = name.charAt(0).toUpperCase() + name.slice(1);
        }
    }

    // Determine rarity
    let rarity = "Common";
    if (streak >= 30 || completions >= 100) {
        rarity = "Legendary";
    } else if (level >= 10 || topSkillLevel >= 5) {
        rarity = "Epic";
    } else if (streak >= 14 || completions >= 50) {
        rarity = "Rare";
    }

    // Pick the most impressive stat and build title + description
    let title, description;

    if (streak >= 30 || completions >= 100) {
        // Legendary tier — pick whichever triggered it
        if (streak >= 30) {
            title       = pick(["Unbroken Chain", "Streak Sovereign", "The Persistent"]);
            description = `Maintained a ${streak}-day streak. Discipline forged into identity.`;
        } else {
            title       = pick(["Mission Centurion", "The Executor", "Task Conqueror"]);
            description = `Conquered ${completions} missions. Each one a brick in the foundation.`;
        }
    } else if (level >= 10) {
        title       = pick(["Orbital Commander", "Star Navigator", "Void Walker"]);
        description = `Reached Level ${level}, ascending beyond what most dare attempt.`;
    } else if (topSkillLevel >= 5) {
        const templates = [
            `Master of ${topSkillName}`,
            `${topSkillName} Adept`,
            `The ${topSkillName} Architect`,
        ];
        title       = pick(templates);
        description = `Leveled ${topSkillName} to ${topSkillLevel}. A specialist born from repetition.`;
    } else if (streak >= 14) {
        title       = pick(["Unbroken Chain", "Streak Sovereign", "The Persistent"]);
        description = `Maintained a ${streak}-day streak. Discipline forged into identity.`;
    } else if (completions >= 50) {
        title       = pick(["Mission Centurion", "The Executor", "Task Conqueror"]);
        description = `Conquered ${completions} missions. Each one a brick in the foundation.`;
    } else if (focusSessions >= 10) {
        title       = pick(["Flow State Initiate", "The Focused", "Deep Work Devotee"]);
        description = `Survived ${focusSessions} focus sessions. The mind sharpened by fire.`;
    } else {
        title       = pick(["Trailblazer", "The Beginning", "First Light"]);
        description = "Every legend starts somewhere. This is where yours began.";
    }

    return {
        id: `token_ai_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title,
        description,
        rarity,
        earnedAt: new Date().toISOString(),
    };
}

const HOF_DESCRIPTION_TEMPLATES = [
    (title, n) => `After ${n} subtask${n !== 1 ? "s" : ""} conquered, ${title} stands complete.`,
    (title)    => `The mission '${title}' has been vanquished.`,
    (title, n) => `Epic victory: ${title} — ${n} challenge${n !== 1 ? "s" : ""} overcome.`,
    (title)    => `Against all odds, '${title}' fell before you.`,
    (title, n) => `${n} obstacle${n !== 1 ? "s" : ""} faced. ${n !== 1 ? "All" : "It"} defeated. Mission: ${title}.`,
    (title)    => `The legend of '${title}' is now sealed in history.`,
];

function pickHofDescription(title, subtaskCount) {
    const fn = HOF_DESCRIPTION_TEMPLATES[Math.floor(Math.random() * HOF_DESCRIPTION_TEMPLATES.length)];
    return fn(title, subtaskCount);
}

function computeEpicRarity(epic) {
    const total = epic.subtasks ? epic.subtasks.length : 0;
    const completed = epic.subtasks ? epic.subtasks.filter((s) => s.completed).length : 0;
    const allDone = total > 0 && completed === total;

    if (allDone && epic.createdAt) {
        const created = new Date(epic.createdAt);
        const finished = epic.completedAt ? new Date(epic.completedAt) : new Date();
        const days = (finished - created) / (1000 * 60 * 60 * 24);
        if (days > 7) return "Legendary";
    }
    if (allDone) return "Epic";
    if (completed > 0) return "Rare";
    return "Common";
}

function generateAchievementToken(epic) {
    const title = typeof epic === "string" ? epic : epic.title;
    const subtaskCount = (epic && epic.subtasks) ? epic.subtasks.filter((s) => s.completed).length : 0;
    const rarity = (epic && typeof epic === "object") ? computeEpicRarity(epic) : "Common";
    return {
        id: `token_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title: `Mission Complete: ${title}`,
        description: pickHofDescription(title, subtaskCount),
        rarity,
        earnedAt: new Date().toISOString()
    };
}

function generateManualToken(title) {
    return {
        id: `token_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        title,
        description: pickHofDescription(title, 0),
        rarity: "Common",
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
        if (last === yesterday) {
            state.profile.streakDays = state.profile.streakDays + 1;
        } else {
            // Streak would break — check for shield
            if (state.loot?.streakShield) {
                state.loot.streakShield = false; // consume the shield
                // Streak is maintained (don't reset it)
            } else {
                state.profile.streakDays = 1;
            }
        }
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

// ─── Challenges ───────────────────────────────────────────────────────────────
function addChallenge() {
    const titleEl  = document.getElementById("challenge-title");
    const typeEl   = document.getElementById("challenge-type");
    const targetEl = document.getElementById("challenge-target");
    const dlEl     = document.getElementById("challenge-deadline");

    const title  = titleEl.value.trim();
    const target = parseInt(targetEl.value, 10);
    if (!title) { titleEl.focus(); return; }
    if (!target || target < 1) { targetEl.focus(); return; }

    const challenge = {
        id:          `ch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title,
        type:        typeEl.value,
        target,
        deadline:    dlEl.value || null,
        createdAt:   new Date().toISOString(),
        completedAt: null,
        claimed:     false,
        xpReward:    calcChallengeXp(target),
        // snapshot: XP at creation time, used to measure xp_earned delta
        xpAtCreation: state.profile.xp + (state.profile.level - 1) * 100
    };

    if (!Array.isArray(state.challenges)) state.challenges = [];
    state.challenges.push(challenge);
    titleEl.value  = "";
    targetEl.value = "";
    dlEl.value     = "";
    touchState();
    persistAndRender();
}

function calcChallengeXp(target) {
    // 50 XP for low targets, up to 150 XP for large ones
    if (target >= 50) return 150;
    if (target >= 20) return 100;
    if (target >= 10) return 75;
    return 50;
}

const CHALLENGE_TYPE_LABELS = {
    tasks_completed:  "Tasks completed",
    habits_completed: "Habits done today",
    focus_sessions:   "Focus sessions",
    xp_earned:        "XP earned"
};

function getChallengeProgress(challenge) {
    const s = state;
    const since = challenge.createdAt;

    switch (challenge.type) {
        case "tasks_completed": {
            return s.tasks.filter(
                t => t.status === "completed" && t.completedAt && t.completedAt >= since
            ).length;
        }
        case "habits_completed": {
            const today = new Date().toISOString().slice(0, 10);
            let count = 0;
            (s.habits || []).forEach(h => {
                if (Array.isArray(h.completedDates) && h.completedDates.includes(today)) count++;
            });
            return count;
        }
        case "focus_sessions": {
            return (s.focus && Array.isArray(s.focus.sessions))
                ? s.focus.sessions.filter(
                    sess => sess.type === "work" && sess.date && sess.date >= since
                  ).length
                : 0;
        }
        case "xp_earned": {
            const currentTotal = s.profile.xp + (s.profile.level - 1) * 100;
            return Math.max(0, currentTotal - (challenge.xpAtCreation || 0));
        }
        default:
            return 0;
    }
}

function checkChallenges() {
    if (!Array.isArray(state.challenges)) return;
    let changed = false;
    state.challenges.forEach(ch => {
        if (ch.completedAt || ch.claimed) return;
        const progress = getChallengeProgress(ch);
        if (progress >= ch.target) {
            ch.completedAt = new Date().toISOString();
            changed = true;
        }
    });
    if (changed) touchState();
}

function claimChallenge(id) {
    if (!Array.isArray(state.challenges)) return;
    const ch = state.challenges.find(c => c.id === id);
    if (!ch || ch.claimed || !ch.completedAt) return;
    ch.claimed = true;
    gainXP(ch.xpReward);
    checkAchievements();
    touchState();
    persistAndRender();
}

function deleteChallenge(id) {
    if (!Array.isArray(state.challenges)) return;
    state.challenges = state.challenges.filter(c => c.id !== id);
    touchState();
    persistAndRender();
}

function renderChallenges() {
    const listEl = document.getElementById("challenge-list");
    if (!listEl) return;
    listEl.innerHTML = "";

    if (!Array.isArray(state.challenges) || state.challenges.length === 0) {
        listEl.innerHTML = `<div class="hint-row">No challenges yet — create one above.</div>`;
        return;
    }

    // Sort: active first, then claimed/completed
    const sorted = [...state.challenges].sort((a, b) => {
        if (a.claimed && !b.claimed) return 1;
        if (!a.claimed && b.claimed) return -1;
        return new Date(a.createdAt) - new Date(b.createdAt);
    });

    sorted.forEach(ch => {
        const progress    = getChallengeProgress(ch);
        const pct         = Math.min(100, Math.round((progress / ch.target) * 100));
        const isComplete  = !!ch.completedAt;
        const isClaimed   = !!ch.claimed;
        const isExpired   = ch.deadline && !isComplete && new Date(ch.deadline + "T23:59:59") < new Date();
        const typeLabel   = CHALLENGE_TYPE_LABELS[ch.type] || ch.type;

        let deadlineHtml = "";
        if (ch.deadline) {
            const formatted = new Date(ch.deadline + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
            if (isExpired) {
                deadlineHtml = `<span class="challenge-deadline expired">Expired · ${formatted}</span>`;
            } else {
                deadlineHtml = `<span class="challenge-deadline">Deadline: ${formatted}</span>`;
            }
        }

        let actionHtml = "";
        if (isClaimed) {
            actionHtml = `<span class="challenge-claimed-badge">Claimed +${ch.xpReward} XP</span>`;
        } else if (isComplete) {
            actionHtml = `<button class="btn-primary challenge-claim-btn" data-id="${ch.id}">Claim +${ch.xpReward} XP</button>`;
        }

        const card = document.createElement("div");
        card.className = `challenge-card${isClaimed ? " challenge-card--claimed" : ""}${isComplete && !isClaimed ? " challenge-card--complete" : ""}`;
        card.innerHTML = `
            <div class="challenge-card-header">
                <span class="challenge-card-title">${ch.title}</span>
                <button class="challenge-delete-btn" data-id="${ch.id}" title="Delete challenge">&times;</button>
            </div>
            <div class="challenge-meta">${typeLabel} &middot; Target: ${ch.target}${deadlineHtml ? " &middot; " : ""}${deadlineHtml}</div>
            <div class="challenge-progress-bar">
                <div class="challenge-progress-fill" style="width:${pct}%"></div>
            </div>
            <div class="challenge-progress-footer">
                <span class="challenge-progress-text">${progress} / ${ch.target} (${pct}%)</span>
                ${actionHtml}
            </div>
        `;

        card.querySelector(".challenge-delete-btn").addEventListener("click", () => deleteChallenge(ch.id));
        const claimBtn = card.querySelector(".challenge-claim-btn");
        if (claimBtn) claimBtn.addEventListener("click", () => claimChallenge(ch.id));

        listEl.appendChild(card);
    });
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
