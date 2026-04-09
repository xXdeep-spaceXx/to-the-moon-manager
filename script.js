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
const taskRecurSelect = document.getElementById("task-recur");
const taskEstimateInput = document.getElementById("task-estimate");
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

// ─── Theme ────────────────────────────────────────────────────────────────────
const THEME_KEY = 'moonTheme';
const VALID_THEMES = ['default', 'solar', 'nebula', 'arctic', 'forest'];

function applyTheme(theme) {
    if (!VALID_THEMES.includes(theme)) theme = 'default';
    if (theme === 'default') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
    localStorage.setItem(THEME_KEY, theme);
    // Sync active swatch highlight
    document.querySelectorAll('.theme-swatch').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === theme);
    });
}

function initThemeSwitcher() {
    const switcher = document.getElementById('theme-switcher');
    if (!switcher) return;
    switcher.addEventListener('click', e => {
        const swatch = e.target.closest('.theme-swatch');
        if (!swatch) return;
        applyTheme(swatch.dataset.theme);
    });
    // Reflect saved theme onto swatches on load
    const saved = localStorage.getItem(THEME_KEY) || 'default';
    document.querySelectorAll('.theme-swatch').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.theme === saved);
    });
}

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
    meta: { lastModified: null, lastSync: null, conflict: false, lastWeeklyReport: null, lastLoginReward: null },
    profile: { xp: 0, level: 1, xpPerTask: 20, streakDays: 0, lastCompletedDate: null, loginDays: [], class: null, prestige: 0, prestigeMultiplier: 1.0 },
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
    loot: { inventory: [], activeBoost: null, streakShield: false, focusBonus: 0, equipped: { weapon: null, armor: null, accessory: null, shipModule: null } },
    mood: [],
    skills: {
        health:   { xp: 0, level: 1 },
        work:     { xp: 0, level: 1 },
        learning: { xp: 0, level: 1 },
        finance:  { xp: 0, level: 1 },
        life:     { xp: 0, level: 1 }
    },
    challenges: [],
    taskTemplates: [],
    crew: []
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
    modules:           {},
    parseNaturalTask:  (rawText) => {
        let cleanText = rawText;
        let inferredCategory = null;
        let inferredDate = null;
        let inferredDateStr = null;

        const lower = cleanText.toLowerCase();
        const today = new Date();

        if (lower.includes("tomorrow")) {
            const t = new Date(today);
            t.setDate(t.getDate() + 1);
            inferredDate = t.toISOString().split('T')[0];
            inferredDateStr = "Tomorrow";
            cleanText = cleanText.replace(/tomorrow/ig, "").trim();
        } else if (lower.includes("today") || lower.includes("tonight")) {
            inferredDate = today.toISOString().split('T')[0];
            inferredDateStr = "Today";
            cleanText = cleanText.replace(/today|tonight/ig, "").trim();
        }

        if (/math|science|study|homework|calculus|class|read/i.test(lower)) inferredCategory = "learning";
        else if (/gym|workout|run|lift|exercise|cardio|sport/i.test(lower)) inferredCategory = "health";
        else if (/pay|buy|budget|finance|money|invest/i.test(lower)) inferredCategory = "finance";
        else if (/code|work|project|meeting/i.test(lower)) inferredCategory = "career";

        return { title: cleanText.replace(/\s+/g, " "), category: inferredCategory, dueDate: inferredDate, dueDateStr: inferredDateStr };
    }
};

// ─── Galaxy Canvas (Three.js) ─────────────────────────────────────────────────
function initGalaxy() {
    const canvas = document.getElementById("galaxy-canvas");
    if (!canvas || !window.THREE) return;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); // Enable antialiasing for wireframe lines
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 3000);
    camera.position.z = 800; // Pull back to see the moon

    function resize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", resize);
    resize();

    // ── The Crimson Moon (Wireframe Sphere) ──────────────────────────────
    const moonGeo = new THREE.IcosahedronGeometry(250, 2); // 2 detail creates a nice low-poly sphere
    const moonMat = new THREE.MeshBasicMaterial({ 
        color: 0xff1111, 
        wireframe: true, 
        transparent: true, 
        opacity: 0.15 
    });
    const moon = new THREE.Mesh(moonGeo, moonMat);
    moon.position.set(0, -350, 0); // Sit at the bottom edge
    scene.add(moon);

    // ── Abstract Geometric Rings ─────────────────────────────────────────
    const rings = new THREE.Group();
    moon.add(rings);
    
    // Ring 1
    const ringGeo1 = new THREE.TorusGeometry(320, 2, 3, 60);
    const ringMat1 = new THREE.MeshBasicMaterial({ color: 0xff3333, wireframe: true, transparent: true, opacity: 0.1 });
    const ring1 = new THREE.Mesh(ringGeo1, ringMat1);
    ring1.rotation.x = Math.PI / 2;
    rings.add(ring1);
    
    // Ring 2
    const ringGeo2 = new THREE.TorusGeometry(380, 1, 3, 80);
    const ringMat2 = new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.05 });
    const ring2 = new THREE.Mesh(ringGeo2, ringMat2);
    ring2.rotation.x = Math.PI / 3;
    ring2.rotation.y = Math.PI / 4;
    rings.add(ring2);

    // ── main star field (Red and White tones) ─────────────────────────────
    const starCount  = 2500;
    const starPos    = new Float32Array(starCount * 3);
    const starColor  = new Float32Array(starCount * 3);
    const starSize   = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
        const r   = 400 + Math.random() * 1200;
        const phi = Math.acos(2 * Math.random() - 1);
        const th  = Math.random() * Math.PI * 2;
        starPos[i*3]   = r * Math.sin(phi) * Math.cos(th);
        starPos[i*3+1] = r * Math.sin(phi) * Math.sin(th);
        starPos[i*3+2] = r * Math.cos(phi);
        
        // Red / White / Crimson tint
        const type = Math.random();
        if (type > 0.8) {
            // Stark White
            starColor[i*3] = 1.0; starColor[i*3+1] = 1.0; starColor[i*3+2] = 1.0;
        } else if (type > 0.4) {
            // Crimson Red
            starColor[i*3] = 1.0; starColor[i*3+1] = 0.1; starColor[i*3+2] = 0.1;
        } else {
            // Deep Dark Red overlaying void
            starColor[i*3] = 0.6; starColor[i*3+1] = 0.05; starColor[i*3+2] = 0.05;
        }
        starSize[i] = Math.random() * 2.0 + 0.5;
    }

    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
    starGeo.setAttribute("color",    new THREE.BufferAttribute(starColor, 3));
    starGeo.setAttribute("size",     new THREE.BufferAttribute(starSize, 1));

    const starMat = new THREE.PointsMaterial({
        size: 1.5, vertexColors: true, transparent: true,
        opacity: 0.8, sizeAttenuation: true
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ── animate ──────────────────────────────────────────────────────────────
    let t = 0;
    (function animate() {
        requestAnimationFrame(animate);
        stars.rotation.y = t * 0.00008;
        stars.rotation.x = t * 0.00003;
        
        moon.rotation.y = t * 0.002;
        moon.rotation.x = t * 0.001;
        ring1.rotation.z = t * 0.003;
        ring2.rotation.y = t * 0.001;

        camera.position.x = Math.sin(t * 0.0004) * 40;
        camera.position.y = Math.cos(t * 0.0003) * 20;
        camera.lookAt(scene.position);
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
    stats:        [124, 58,  237],
    calendar:     [34,  197, 94],
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
        orb.style.pointerEvents = 'auto';
    } else {
        // Hide orb on non-dashboard pages
        orb.style.opacity = '0';
        orb.style.pointerEvents = 'none';
        
        // We still provide some default layout coordinates so the transition doesn't warp weirdly
        const vw   = document.documentElement.clientWidth;
        const size = Math.min(Math.round(vw * 0.38), 500);
        orb.style.width   = size + 'px';
        orb.style.height  = size + 'px';
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
    if (name === "stats" && window.APP && window.APP.renderStats) {
        setTimeout(function () { window.APP.renderStats(); }, 0);
    }
    if (name === "calendar" && window.APP && window.APP.renderCalendar) {
        setTimeout(function () { window.APP.renderCalendar(); }, 0);
    }

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

// ─── Weekly Report ────────────────────────────────────────────────────────────
function getThisMonday() {
    const d = new Date();
    const day = d.getDay() || 7; // 1=Mon … 7=Sun
    d.setDate(d.getDate() - (day - 1));
    return d.toISOString().slice(0, 10);
}

function getLastWeekRange() {
    const thisMonday = new Date(getThisMonday());
    const lastMonday = new Date(thisMonday);
    lastMonday.setDate(lastMonday.getDate() - 7);
    const lastSunday = new Date(thisMonday);
    lastSunday.setDate(lastSunday.getDate() - 1);
    lastSunday.setHours(23, 59, 59, 999);
    return { start: lastMonday, end: lastSunday };
}

function checkWeeklyReport() {
    const thisMonday = getThisMonday();

    // Already shown this week
    if (state.meta.lastWeeklyReport === thisMonday) return;

    const { start, end } = getLastWeekRange();

    // Ensure there is any data before this week (user has been active for at least 1 week)
    const allCompleted = (state.tasks || []).filter(t => t.status === "completed" && t.completedAt);
    const hasOldData = allCompleted.some(t => new Date(t.completedAt) < start);
    const lastWeekTasks = allCompleted.filter(t => {
        const d = new Date(t.completedAt);
        return d >= start && d <= end;
    });

    // Only show the modal if there was activity last week OR user has old data (has been around 1+ week)
    if (lastWeekTasks.length === 0 && !hasOldData) return;
    if (lastWeekTasks.length === 0) return; // no last-week data → skip silently

    // XP earned last week
    const xpEarned = lastWeekTasks.reduce((sum, t) => sum + (t.xpValue || 0), 0);

    // Best day
    const dayCounts = {};
    const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    lastWeekTasks.forEach(t => {
        const day = DAY_NAMES[new Date(t.completedAt).getDay()];
        dayCounts[day] = (dayCounts[day] || 0) + 1;
    });
    let bestDay = "—", bestDayCount = 0;
    Object.entries(dayCounts).forEach(([day, count]) => {
        if (count > bestDayCount) { bestDayCount = count; bestDay = day; }
    });

    // Habits maintained every day of last week
    let habitsMaintained = 0;
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        weekDates.push(d.toISOString().slice(0, 10));
    }
    (state.habits || []).forEach(h => {
        if (!Array.isArray(h.completedDates)) return;
        const allDone = weekDates.every(date => h.completedDates.includes(date));
        if (allDone) habitsMaintained++;
    });

    // Focus sessions last week
    const focusSessions = (state.focus && Array.isArray(state.focus.sessions))
        ? state.focus.sessions.filter(s => {
            const d = new Date(s.date);
            return d >= start && d <= end;
        }).length
        : 0;

    // Boss defeated last week — check weekId against last week's ISO week
    const lastMondayDate = new Date(start);
    const lastMondayDay = lastMondayDate.getDay() || 7;
    const tmp = new Date(lastMondayDate);
    tmp.setDate(tmp.getDate() + 4 - lastMondayDay);
    const lastWeekYear = tmp.getFullYear();
    const lastWeekNum = Math.ceil((((tmp - new Date(lastWeekYear, 0, 1)) / 86400000) + 1) / 7);
    const lastWeekId = `${lastWeekYear}-W${String(lastWeekNum).padStart(2, '0')}`;
    const bossDefeated = !!(state.boss && state.boss.weekId === lastWeekId && state.boss.defeated);

    // Motivational line
    let motivation;
    const score = lastWeekTasks.length + focusSessions + habitsMaintained * 2;
    if (score >= 20)      motivation = "Legendary week. You're unstoppable — keep pushing toward the Moon.";
    else if (score >= 12) motivation = "Solid performance, Commander. Momentum is everything.";
    else if (score >= 6)  motivation = "Good progress. Every mission completed moves the ship forward.";
    else                  motivation = "Small steps count. Launch again this week — you've got this.";

    // Build modal content
    const modal = document.getElementById("weekly-report-modal");
    if (!modal) return;

    modal.querySelector(".wr-stat-val[data-stat='missions']").textContent = lastWeekTasks.length;
    modal.querySelector(".wr-stat-val[data-stat='xp']").textContent = `+${xpEarned} XP`;
    modal.querySelector(".wr-stat-val[data-stat='bestday']").textContent = bestDayCount > 0 ? `${bestDay} (${bestDayCount})` : "—";
    modal.querySelector(".wr-stat-val[data-stat='habits']").textContent = habitsMaintained + " / " + (state.habits || []).length;
    modal.querySelector(".wr-stat-val[data-stat='focus']").textContent = focusSessions;
    modal.querySelector(".wr-stat-val[data-stat='boss']").textContent = bossDefeated ? "Defeated ✓" : "Escaped";
    modal.querySelector(".wr-boss-val").classList.toggle("wr-boss-defeated", bossDefeated);
    modal.querySelector(".wr-motivation").textContent = motivation;

    modal.classList.remove("hidden");
    requestAnimationFrame(() => modal.classList.add("wr-visible"));

    // Mark shown and persist
    state.meta.lastWeeklyReport = thisMonday;
    storage.save(state);
}

// ─── Daily Login Reward ───────────────────────────────────────────────────────
const DAILY_REWARD_LOOT_TABLE = [
    { name: "Star Fragment",   emoji: "⭐",  rarity: "common",    desc: "A small piece of cosmic energy." },
    { name: "Focus Crystal",   emoji: "💎",  rarity: "common",    desc: "Sharpens your concentration." },
    { name: "Speed Boots",     emoji: "👟",  rarity: "common",    desc: "You move a little faster today." },
    { name: "Energy Drink",    emoji: "⚡",  rarity: "common",    desc: "+10% productivity for the hour." },
    { name: "Map Fragment",    emoji: "🗺️", rarity: "common",    desc: "Part of a larger picture." },
    { name: "Nebula Core",     emoji: "🌌",  rarity: "rare",      desc: "Dense with stored potential." },
    { name: "Time Shard",      emoji: "⏳",  rarity: "rare",      desc: "A sliver of reclaimed time." },
    { name: "Moon Dust",       emoji: "🌙",  rarity: "rare",      desc: "Collected from the lunar surface." },
    { name: "Warp Drive",      emoji: "🚀",  rarity: "rare",      desc: "Doubles your next mission's XP." },
    { name: "Cosmic Key",      emoji: "🗝️", rarity: "legendary", desc: "Opens doors that were never there." },
    { name: "Phoenix Feather", emoji: "🔥",  rarity: "legendary", desc: "Rise from any setback." },
    { name: "Galaxy Orb",      emoji: "🔮",  rarity: "legendary", desc: "You can see every possible outcome." },
    { name: "Cosmic Shield",   emoji: "🛡️", rarity: "rare",      desc: "An impenetrable barrier of star-stuff." },
];

// ─── Seasonal Events ──────────────────────────────────────────────────────────
const SEASONAL_EVENTS = [
    {
        name: "New Year Sprint",
        emoji: "🎆",
        description: "Ring in the new year with double the gains!",
        start: "01-01",
        end: "01-07",
        type: "xp2x",
        bonusText: "Double XP on all missions"
    },
    {
        name: "Valentine's Push",
        emoji: "💝",
        description: "Show your goals some love.",
        start: "02-14",
        end: "02-16",
        type: "xp1_5x",
        bonusText: "+50% XP on all missions"
    },
    {
        name: "Spring Surge",
        emoji: "🌸",
        description: "New season, new loot. Drop rates are up!",
        start: "03-20",
        end: "03-31",
        type: "loot_boost",
        bonusText: "+20% loot drop rate"
    },
    {
        name: "Summer Grind",
        emoji: "☀️",
        description: "The sun never sets on your grind.",
        start: "06-21",
        end: "07-04",
        type: "xp2x",
        bonusText: "Double XP on all missions"
    },
    {
        name: "Back to Focus",
        emoji: "📚",
        description: "Season of knowledge. Learning tasks reward double.",
        start: "09-01",
        end: "09-15",
        type: "learning_boost",
        bonusText: "Double XP on Learning missions"
    },
    {
        name: "Spooky Sprint",
        emoji: "🎃",
        description: "A fearsome boss lurks. Complete missions for +20% XP!",
        start: "10-01",
        end: "10-31",
        type: "halloween",
        bonusText: "+20% XP + special boss event"
    },
    {
        name: "Year-End Blitz",
        emoji: "🎄",
        description: "Finish the year strong. Double XP and bonus loot await!",
        start: "12-15",
        end: "12-31",
        type: "xmas",
        bonusText: "Double XP + guaranteed loot drops"
    },
];

function getActiveEvent() {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day   = String(now.getDate()).padStart(2, '0');
    const today = `${month}-${day}`;

    for (const event of SEASONAL_EVENTS) {
        const { start, end } = event;
        // Handle events that wrap across year boundary (none currently, but safe)
        if (start <= end) {
            if (today >= start && today <= end) return event;
        } else {
            if (today >= start || today <= end) return event;
        }
    }
    return null;
}

function showDailyRewardToast(lines) {
    const existing = document.querySelector('.daily-reward-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'daily-reward-toast';
    toast.innerHTML = `
        <div class="daily-reward-icon">🌅</div>
        <div class="daily-reward-body">
            <div class="daily-reward-title">Daily Reward!</div>
            ${lines.map(l => `<div class="daily-reward-line">${l}</div>`).join('')}
        </div>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('daily-reward-toast--visible'));
    });

    setTimeout(() => {
        toast.classList.remove('daily-reward-toast--visible');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 600);
    }, 3000);
}

// ─── Character Classes ────────────────────────────────────────────────────────
const CLASS_DEFINITIONS = {
    warrior: {
        id: 'warrior',
        name: 'Warrior',
        emoji: '⚔️',
        bonus: '+50% XP on Hard difficulty tasks',
        color: '#e05252',
        glow: 'rgba(224, 82, 82, 0.35)',
    },
    mage: {
        id: 'mage',
        name: 'Mage',
        emoji: '🔮',
        bonus: 'Double XP from Learning & Work tasks',
        color: '#9b6fff',
        glow: 'rgba(155, 111, 255, 0.35)',
    },
    rogue: {
        id: 'rogue',
        name: 'Rogue',
        emoji: '🗡️',
        bonus: '+10% XP per 7-day streak block (max +50%)',
        color: '#4ecdc4',
        glow: 'rgba(78, 205, 196, 0.35)',
    },
    explorer: {
        id: 'explorer',
        name: 'Explorer',
        emoji: '🧭',
        bonus: '+20% loot drop rate · +15% XP on all tasks',
        color: '#f4a742',
        glow: 'rgba(244, 167, 66, 0.35)',
    },
};

// ─── Crew Roster ──────────────────────────────────────────────────────────────
const CREW_ROSTER = [
    {
        id: 'kai',
        name: 'Kai',
        role: 'Navigator',
        emoji: '👨‍✈️',
        unlockLevel: 3,
        quote: "I've charted a course to your first milestone. The stars are watching.",
        quip: "Kai: Stay on course — every mission logged is a star charted.",
    },
    {
        id: 'luna',
        name: 'Luna',
        role: 'Engineer',
        emoji: '🧑‍🔬',
        unlockLevel: 6,
        quote: "Systems online. Your momentum is creating real structural changes.",
        quip: "Luna: The engine runs on consistency. Keep fueling it.",
    },
    {
        id: 'rex',
        name: 'Rex',
        role: 'AI Tactical',
        emoji: '🤖',
        unlockLevel: 9,
        quote: "Pattern analysis complete. You are outperforming 73% of known mission profiles.",
        quip: "Rex: Data confirms it — your output this week is above baseline.",
    },
    {
        id: 'zara',
        name: 'Zara',
        role: 'Strategist',
        emoji: '🧙‍♀️',
        unlockLevel: 12,
        quote: "The resistance was real. You broke through it anyway. That's rare.",
        quip: "Zara: Rare minds push when momentum stalls. You did.",
    },
    {
        id: 'nova',
        name: 'Nova',
        role: 'Commander',
        emoji: '🌟',
        unlockLevel: 15,
        quote: "Few reach this altitude. You've earned your rank, Commander.",
        quip: "Nova: Command is earned, not given. Lead on.",
    },
];

function showCrewUnlockModal(member) {
    const existingId = 'crew-unlock-modal';
    if (document.getElementById(existingId)) return;

    const overlay = document.createElement('div');
    overlay.id = existingId;
    overlay.className = 'crew-modal-overlay';

    overlay.innerHTML = `
        <div class="crew-modal">
            <div class="crew-modal-eyebrow">New Crew Member!</div>
            <div class="crew-modal-portrait">${member.emoji}</div>
            <div class="crew-modal-name">${member.name}</div>
            <div class="crew-modal-role">${member.role}</div>
            <div class="crew-modal-quote"><em>"${member.quote}"</em></div>
            <button class="crew-modal-dismiss">Welcome aboard!</button>
        </div>
    `;

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => overlay.classList.add('crew-modal-overlay--visible'));
    });

    overlay.querySelector('.crew-modal-dismiss').addEventListener('click', () => {
        overlay.classList.remove('crew-modal-overlay--visible');
        overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
        setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 600);
    });
}

function renderCrewSection() {
    const container = document.getElementById('crew-section');
    if (!container) return;

    const unlockedIds = Array.isArray(state.crew) ? state.crew : [];
    if (unlockedIds.length === 0) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');
    const row = container.querySelector('.crew-avatar-row');
    if (!row) return;

    row.innerHTML = CREW_ROSTER
        .filter(m => unlockedIds.includes(m.id))
        .map(m => `
            <div class="crew-avatar" data-tip="${m.name} · ${m.role}">
                <span class="crew-avatar-emoji">${m.emoji}</span>
                <div class="crew-avatar-tooltip">${m.name}<br><span>${m.role}</span></div>
            </div>
        `).join('');
}

function checkCrewUnlocks(previousLevel, newLevel) {
    if (!Array.isArray(state.crew)) state.crew = [];
    const triggered = CREW_ROSTER.filter(m =>
        m.unlockLevel > previousLevel &&
        m.unlockLevel <= newLevel &&
        !state.crew.includes(m.id)
    );
    triggered.forEach(m => {
        state.crew.push(m.id);
    });
    if (triggered.length > 0) {
        // Show modal for the highest-level member unlocked (show sequentially if multiple)
        triggered.forEach((m, i) => {
            setTimeout(() => showCrewUnlockModal(m), i * 700 + 400);
        });
    }
}

function showClassSelectionModal() {
    if (document.getElementById('class-select-modal')) return; // already open
    if (state.profile.class !== null) return; // already chosen

    const overlay = document.createElement('div');
    overlay.id = 'class-select-modal';
    overlay.className = 'class-modal-overlay';

    overlay.innerHTML = `
        <div class="class-modal">
            <div class="class-modal-header">
                <div class="class-modal-title">Choose Your Class</div>
                <div class="class-modal-subtitle">You have reached Level 5. Your destiny awaits — choose wisely, this cannot be changed.</div>
            </div>
            <div class="class-modal-cards">
                ${Object.values(CLASS_DEFINITIONS).map(c => `
                    <button class="class-card" data-class="${c.id}" style="--class-color:${c.color};--class-glow:${c.glow}">
                        <div class="class-card-emoji">${c.emoji}</div>
                        <div class="class-card-name">${c.name}</div>
                        <div class="class-card-bonus">${c.bonus}</div>
                    </button>
                `).join('')}
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
        requestAnimationFrame(() => overlay.classList.add('class-modal-overlay--visible'));
    });

    overlay.querySelectorAll('.class-card').forEach(btn => {
        btn.addEventListener('click', () => {
            const chosen = btn.dataset.class;
            state.profile.class = chosen;
            touchState();
            persistAndRender();

            // Dismiss
            overlay.classList.remove('class-modal-overlay--visible');
            overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
            setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 600);

            // Confirmation toast
            const info = CLASS_DEFINITIONS[chosen];
            showDailyRewardToast([`You are now a ${info.emoji} ${info.name}!`, info.bonus]);
        });
    });
}

function showPrestigeModal() {
    if (document.getElementById('prestige-modal')) return;
    if (state.profile.level < 20) return;

    const nextPrestige = (state.profile.prestige ?? 0) + 1;
    const ordinals = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];
    const tierLabel = ordinals[nextPrestige - 1] || `${nextPrestige}`;
    const newMultiplier = (1.0 + nextPrestige * 0.10).toFixed(1);

    const overlay = document.createElement('div');
    overlay.id = 'prestige-modal';
    overlay.className = 'prestige-modal-overlay';

    overlay.innerHTML = `
        <div class="prestige-modal">
            <div class="prestige-modal-header">
                <div class="prestige-modal-icon">⭐</div>
                <div class="prestige-modal-title">Prestige ${tierLabel}</div>
                <div class="prestige-modal-subtitle">
                    You have reached Level 20 and unlocked the power to Prestige.<br>
                    Reset to Level 1 in exchange for a <strong>permanent +10% XP bonus</strong> and a Prestige Star.
                </div>
            </div>
            <div class="prestige-modal-details">
                <div class="prestige-detail-row">
                    <span class="prestige-detail-label">New XP Multiplier</span>
                    <span class="prestige-detail-val">${newMultiplier}×</span>
                </div>
                <div class="prestige-detail-row">
                    <span class="prestige-detail-label">Hall of Fame Token</span>
                    <span class="prestige-detail-val prestige-legendary">Prestige ${tierLabel} · Legendary</span>
                </div>
                <div class="prestige-detail-row prestige-warning-row">
                    <span class="prestige-detail-label">Level &amp; XP</span>
                    <span class="prestige-detail-val prestige-reset-val">Reset to 1 / 0</span>
                </div>
            </div>
            <div class="prestige-modal-note">Tasks, habits, and all other data are kept.</div>
            <div class="prestige-modal-actions">
                <button class="btn-secondary" id="prestige-cancel-btn">Cancel</button>
                <button class="prestige-confirm-btn" id="prestige-confirm-btn">⭐ Prestige Now</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => overlay.classList.add('prestige-modal-overlay--visible'));
    });

    const close = () => {
        overlay.classList.remove('prestige-modal-overlay--visible');
        overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
        setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 600);
    };

    document.getElementById('prestige-cancel-btn').addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

    document.getElementById('prestige-confirm-btn').addEventListener('click', () => {
        close();
        doPrestige();
    });
}

function doPrestige() {
    const ordinals = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];
    state.profile.prestige = (state.profile.prestige ?? 0) + 1;
    state.profile.prestigeMultiplier = parseFloat((1.0 + state.profile.prestige * 0.10).toFixed(2));

    // Reset level and XP only
    state.profile.level = 1;
    state.profile.xp = 0;

    // Add Legendary HOF token
    const tierLabel = ordinals[state.profile.prestige - 1] || `${state.profile.prestige}`;
    const token = {
        id: `token_prestige_${state.profile.prestige}_${Date.now()}`,
        title: `Prestige ${tierLabel}`,
        description: `Transcended mortality and reset to Level 1, carrying ${state.profile.prestigeMultiplier}× XP power forward.`,
        rarity: 'Legendary',
        earnedAt: new Date().toISOString()
    };
    state.hallOfFame.push(token);

    touchState();
    persistAndRender();

    showDailyRewardToast([
        `⭐ Prestige ${tierLabel} achieved!`,
        `XP multiplier is now ${state.profile.prestigeMultiplier}×`
    ]);
}

function showClassBonusToast(emoji, className, bonusXp) {
    if (bonusXp <= 0) return;
    const existing = document.querySelector('.class-bonus-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'class-bonus-toast';
    toast.textContent = `${emoji} ${className} bonus: +${bonusXp} XP`;
    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        requestAnimationFrame(() => toast.classList.add('class-bonus-toast--visible'));
    });

    setTimeout(() => {
        toast.classList.remove('class-bonus-toast--visible');
        toast.addEventListener('transitionend', () => toast.remove(), { once: true });
        setTimeout(() => { if (toast.parentNode) toast.remove(); }, 500);
    }, 2500);
}

function checkDailyLoginReward() {
    const today = new Date().toISOString().slice(0, 10);
    if (state.meta.lastLoginReward === today) return;

    const roll = Math.random();
    const lines = [];

    // 10% chance: bonus XP + loot drop
    // 20% chance: loot drop only
    // 70% chance: small XP
    if (roll < 0.10) {
        // Bonus XP + loot
        gainXP(50);
        lines.push('+50 XP');
        const template = DAILY_REWARD_LOOT_TABLE[Math.floor(Math.random() * DAILY_REWARD_LOOT_TABLE.length)];
        if (template && state.loot && Array.isArray(state.loot.inventory)) {
            const item = {
                id: 'loot_daily_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
                name: template.name,
                emoji: template.emoji,
                rarity: template.rarity,
                desc: template.desc,
                earnedAt: new Date().toISOString(),
            };
            state.loot.inventory.push(item);
            lines.push(`Loot Drop: ${template.emoji} ${template.name}!`);
        }
    } else if (roll < 0.30) {
        // Loot drop only
        const template = DAILY_REWARD_LOOT_TABLE[Math.floor(Math.random() * DAILY_REWARD_LOOT_TABLE.length)];
        if (template && state.loot && Array.isArray(state.loot.inventory)) {
            const item = {
                id: 'loot_daily_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
                name: template.name,
                emoji: template.emoji,
                rarity: template.rarity,
                desc: template.desc,
                earnedAt: new Date().toISOString(),
            };
            state.loot.inventory.push(item);
            lines.push(`Loot Drop: ${template.emoji} ${template.name}!`);
        }
    } else {
        // Small XP (10–25)
        const xp = Math.floor(Math.random() * 16) + 10;
        gainXP(xp);
        lines.push(`+${xp} XP`);
    }

    state.meta.lastLoginReward = today;
    touchState();
    persistAndRender();

    if (lines.length > 0) {
        showDailyRewardToast(lines);
    }
}

function showAppShell() {
    document.getElementById("screen-auth").classList.add("hidden");
    document.getElementById("app-shell").classList.remove("hidden");
    showPage("dashboard");
    setTimeout(() => { positionOrb("dashboard", false); initOrb(); }, 50);
    setTimeout(() => checkWeeklyReport(), 1200);
    setTimeout(() => checkDailyLoginReward(), 2000);
    setTimeout(() => {
        if (state.profile.level >= 5 && state.profile.class === null) {
            showClassSelectionModal();
        }
    }, 3200);
    // Ask for notification permission once, non-intrusively, after 5s
    setTimeout(() => requestStreakNotificationPermission(), 5000);
    // Check streak warning on load
    checkStreakWarning();
    // Re-check when user returns to the tab
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkStreakWarning();
    });
    // Re-check every 30 minutes
    setInterval(() => checkStreakWarning(), 30 * 60 * 1000);
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

// Template panel toggle
const templateToggleBtn = document.getElementById("template-toggle-btn");
const templatePanel     = document.getElementById("template-panel");
if (templateToggleBtn && templatePanel) {
    templateToggleBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const open = templatePanel.classList.toggle("hidden");
        if (!open) renderTemplatePanel();
    });
    document.addEventListener("click", (e) => {
        if (!templatePanel.classList.contains("hidden") &&
            !templatePanel.contains(e.target) &&
            e.target !== templateToggleBtn) {
            templatePanel.classList.add("hidden");
        }
    });
}

// Save as template
const saveTemplateBtn = document.getElementById("save-template-btn");
if (saveTemplateBtn) saveTemplateBtn.addEventListener("click", saveAsTemplate);

addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keypress", (e) => { if (e.key === "Enter") addTask(); });

// NLP Autocomplete Magic
taskInput.addEventListener("input", () => {
    if (window.APP && window.APP.parseNaturalTask) {
        const res = window.APP.parseNaturalTask(taskInput.value);
        if (res.category && categorySelect) categorySelect.value = res.category;
        if (res.dueDate && taskDueInput) taskDueInput.value = res.dueDate;
    }
});

// Estimate quick-pick buttons
document.querySelectorAll(".estimate-quick-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const mins = btn.dataset.mins;
        if (taskEstimateInput) {
            taskEstimateInput.value = mins;
            document.querySelectorAll(".estimate-quick-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
        }
    });
});
if (taskEstimateInput) {
    taskEstimateInput.addEventListener("input", () => {
        document.querySelectorAll(".estimate-quick-btn").forEach(b => b.classList.remove("active"));
    });
}

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
// Weekly report dismiss
document.getElementById("wr-dismiss-btn").addEventListener("click", () => {
    const modal = document.getElementById("weekly-report-modal");
    modal.classList.remove("wr-visible");
    modal.addEventListener("transitionend", () => modal.classList.add("hidden"), { once: true });
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
    const loadedEquipped = (loadedLoot.equipped && typeof loadedLoot.equipped === 'object') ? loadedLoot.equipped : {};
    const loot = {
        inventory:   Array.isArray(loadedLoot.inventory) ? loadedLoot.inventory : [],
        activeBoost:  loadedLoot.activeBoost  ?? null,
        streakShield: loadedLoot.streakShield ?? false,
        focusBonus:   loadedLoot.focusBonus   ?? 0,
        equipped: {
            weapon:     loadedEquipped.weapon     ?? null,
            armor:      loadedEquipped.armor      ?? null,
            accessory:  loadedEquipped.accessory  ?? null,
            shipModule: loadedEquipped.shipModule ?? null,
        },
    };
    return {
        version: STATE_VERSION,
        meta: { lastModified: meta.lastModified ?? null, lastSync: meta.lastSync ?? null, conflict: meta.conflict ?? false, lastWeeklyReport: meta.lastWeeklyReport ?? null, lastLoginReward: meta.lastLoginReward ?? null },
        profile: { xp: profile.xp ?? 0, level: profile.level ?? 1, xpPerTask: profile.xpPerTask ?? 20, streakDays: profile.streakDays ?? 0, lastCompletedDate: profile.lastCompletedDate ?? null, loginDays: Array.isArray(profile.loginDays) ? profile.loginDays : [], class: profile.class ?? null, prestige: profile.prestige ?? 0, prestigeMultiplier: profile.prestigeMultiplier ?? 1.0 },
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
        challenges: Array.isArray(loaded.challenges) ? loaded.challenges : [],
        taskTemplates: Array.isArray(loaded.taskTemplates) ? loaded.taskTemplates : [],
        crew: Array.isArray(loaded.crew) ? loaded.crew : []
    };
}

// ─── Task Templates ───────────────────────────────────────────────────────────
const BUILTIN_TEMPLATES = [
    { id: "tpl_morning",    name: "Morning Routine",     text: "Morning Routine",     category: "life",     difficulty: "easy",   priority: "normal", estimateMins: 30  },
    { id: "tpl_deepwork",   name: "Deep Work Session",   text: "Deep Work Session",   category: "work",     difficulty: "hard",   priority: "high",   estimateMins: 120 },
    { id: "tpl_wklyreview", name: "Weekly Review",       text: "Weekly Review",       category: "work",     difficulty: "medium", priority: "normal", estimateMins: 60  },
    { id: "tpl_exercise",   name: "Exercise",            text: "Exercise",            category: "health",   difficulty: "medium", priority: "normal", estimateMins: 45  },
    { id: "tpl_read",       name: "Read for 30 mins",    text: "Read for 30 mins",    category: "learning", difficulty: "easy",   priority: "low",    estimateMins: 30  },
    { id: "tpl_budget",     name: "Budget Check",        text: "Budget Check",        category: "finance",  difficulty: "easy",   priority: "normal", estimateMins: 20  },
];

function applyTemplate(tpl) {
    taskInput.value           = tpl.text;
    categorySelect.value      = tpl.category;
    difficultySelect.value    = tpl.difficulty;
    prioritySelect.value      = tpl.priority;
    if (taskEstimateInput) {
        taskEstimateInput.value = tpl.estimateMins || "";
        document.querySelectorAll(".estimate-quick-btn").forEach(b => {
            b.classList.toggle("active", parseInt(b.dataset.mins, 10) === tpl.estimateMins);
        });
    }
    // close panel
    const panel = document.getElementById("template-panel");
    if (panel) panel.classList.add("hidden");
    taskInput.focus();
}

function saveAsTemplate() {
    const name = (prompt("Template name:") || "").trim();
    if (!name) return;
    const rawEstimate = taskEstimateInput ? parseInt(taskEstimateInput.value, 10) : NaN;
    const tpl = {
        id: `utpl_${Date.now()}`,
        name,
        text:         taskInput.value.trim() || name,
        category:     categorySelect.value,
        difficulty:   difficultySelect.value,
        priority:     prioritySelect.value,
        estimateMins: (!isNaN(rawEstimate) && rawEstimate > 0) ? rawEstimate : null
    };
    if (!Array.isArray(state.taskTemplates)) state.taskTemplates = [];
    state.taskTemplates.push(tpl);
    touchState();
    persistAndRender();
    renderTemplatePanel();
}

function deleteUserTemplate(id) {
    if (!Array.isArray(state.taskTemplates)) return;
    state.taskTemplates = state.taskTemplates.filter(t => t.id !== id);
    touchState();
    persistAndRender();
    renderTemplatePanel();
}

function renderTemplatePanel() {
    const panel = document.getElementById("template-panel");
    if (!panel) return;
    const list = panel.querySelector(".template-list");
    if (!list) return;
    list.innerHTML = "";

    const userTemplates = Array.isArray(state.taskTemplates) ? state.taskTemplates : [];
    const allTemplates = [...BUILTIN_TEMPLATES, ...userTemplates];

    if (allTemplates.length === 0) {
        list.innerHTML = '<p class="template-empty">No templates yet.</p>';
        return;
    }

    if (BUILTIN_TEMPLATES.length) {
        const label = document.createElement("div");
        label.className = "template-group-label";
        label.textContent = "Built-in";
        list.appendChild(label);
        BUILTIN_TEMPLATES.forEach(tpl => {
            list.appendChild(buildTemplateRow(tpl, false));
        });
    }

    if (userTemplates.length) {
        const label = document.createElement("div");
        label.className = "template-group-label";
        label.textContent = "Saved";
        list.appendChild(label);
        userTemplates.forEach(tpl => {
            list.appendChild(buildTemplateRow(tpl, true));
        });
    }
}

function buildTemplateRow(tpl, deletable) {
    const row = document.createElement("div");
    row.className = "template-row";

    const info = document.createElement("button");
    info.className = "template-apply-btn";
    const mins = tpl.estimateMins;
    const timeStr = mins ? (mins >= 60 ? `${mins / 60}h` : `${mins}m`) : "";
    info.innerHTML = `<span class="template-name">${tpl.name}</span><span class="template-meta">${tpl.category} · ${tpl.difficulty} · ${tpl.priority}${timeStr ? " · " + timeStr : ""}</span>`;
    info.addEventListener("click", () => applyTemplate(tpl));
    row.appendChild(info);

    if (deletable) {
        const del = document.createElement("button");
        del.className = "template-delete-btn";
        del.title = "Delete template";
        del.textContent = "×";
        del.addEventListener("click", (e) => { e.stopPropagation(); deleteUserTemplate(tpl.id); });
        row.appendChild(del);
    }

    return row;
}

// ─── Render ───────────────────────────────────────────────────────────────────
function render() {
    renderTasks();
    renderHud();
    renderEventBanner();
    renderInsights();
    renderConflictBanner();
    renderAchievements();
    renderHallOfFame();
    renderEpics();
    renderProfilePreview();
    renderSimilarUsers();
    renderChallenges();
    renderCrewSection();
    // Feature module renders
    window.APP.renderHooks.forEach(fn => { try { fn(); } catch(e) { console.warn("render hook error", e); } });
    
    // Bind animations to newly rendered DOM elements
    bindScrollAnimations();
}

let scrollObserver = null;
function bindScrollAnimations() {
    if (!scrollObserver) {
        scrollObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("in-view");
                }
            });
        }, { threshold: 0.05, rootMargin: "0px 0px -40px 0px" });
    }
    
    document.querySelectorAll('.card:not(.slide-up-fade), .epic-card:not(.slide-up-fade), .stat-box:not(.slide-up-fade), .timeline-item:not(.slide-up-fade), .loot-card:not(.slide-up-fade), .habit-card:not(.slide-up-fade)').forEach(el => {
        el.classList.add('slide-up-fade');
        scrollObserver.observe(el);
    });
}

function getDueDateStatus(dueDate) {
    if (!dueDate) return null;
    const today = new Date().toISOString().slice(0, 10);
    if (dueDate < today) return "overdue";
    if (dueDate === today) return "today";
    return "future";
}

function formatEstimate(mins) {
    if (!mins || mins <= 0) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
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

        // Subtask progress helpers (only for active tasks with subtasks)
        const subs = (!isDone && task.subtasks && task.subtasks.length > 0) ? task.subtasks : [];
        const subDone = subs.filter(s => s.done).length;
        const subTotal = subs.length;
        const allSubsDone = subTotal > 0 && subDone === subTotal;
        const progressBadge = subTotal > 0
            ? `<span class="task-sub-progress${allSubsDone ? ' task-sub-progress--all' : ''}">${subDone}/${subTotal}</span>`
            : '';

        li.innerHTML = `
            <div class="task-main-row">
                <div class="task-content">
                    ${!isDone && subTotal > 0 ? `<button class="task-expand-btn" title="Toggle subtasks">▶</button>` : ''}
                    <div class="task-text-block">
                        <span class="task-text"${isDone ? ' style="opacity:0.5;text-decoration:line-through"' : ''}>${task.text}</span>
                        <span class="task-meta">${task.category} · ${task.difficulty} · ${task.priority}${subTotal > 0 ? ' · ' : ''}${progressBadge}</span>
                        ${task.recur && task.recur !== 'none' ? `<span class="task-recur-badge">↻ ${task.recur.charAt(0).toUpperCase() + task.recur.slice(1)}</span>` : ''}
                        ${task.estimateMins ? `<span class="task-estimate-badge">⏱ ${formatEstimate(task.estimateMins)}</span>` : ''}
                        ${renderDueDateLabel(task.dueDate)}
                    </div>
                </div>
                <div class="task-actions">
                    ${isDone ? '' : '<button class="edit-btn" title="Edit task">✎</button>'}
                    ${isDone ? '' : `<button class="delete-btn${allSubsDone ? ' delete-btn--glow' : ''}" title="Mark complete">✓</button>`}
                </div>
            </div>
            ${!isDone ? `<div class="task-subtasks hidden"></div>` : ''}
        `;

        if (!isDone) {
            const deleteBtn = li.querySelector(".delete-btn");
            deleteBtn.addEventListener("click", () => completeTask(task.id));
            li.querySelector(".edit-btn").addEventListener("click", () => startInlineEdit(task, li));

            // Expand/collapse toggle
            const expandBtn = li.querySelector(".task-expand-btn");
            const subtasksPanel = li.querySelector(".task-subtasks");
            if (expandBtn && subtasksPanel) {
                expandBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    const isOpen = !subtasksPanel.classList.contains("hidden");
                    if (isOpen) {
                        subtasksPanel.classList.add("hidden");
                        expandBtn.textContent = "▶";
                    } else {
                        renderSubtasksPanel(task, subtasksPanel, deleteBtn);
                        subtasksPanel.classList.remove("hidden");
                        expandBtn.textContent = "▼";
                    }
                });
            }

            // Also add a "no subtasks yet" expand via a dedicated add-subtask inline button
            // Always render the subtasks panel stub with the add row even if subTotal === 0
            // We render it lazily on expand; but we need an expand toggle even when no subs exist
            if (!expandBtn) {
                // No subtasks yet — inject a lightweight expand toggle into the task-content
                // so user can click it to open the add-subtask row
                const contentEl = li.querySelector(".task-content");
                const toggleBtn = document.createElement("button");
                toggleBtn.className = "task-expand-btn task-expand-btn--empty";
                toggleBtn.title = "Add subtasks";
                toggleBtn.textContent = "▶";
                contentEl.insertBefore(toggleBtn, contentEl.firstChild);
                if (subtasksPanel) {
                    toggleBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        const isOpen = !subtasksPanel.classList.contains("hidden");
                        if (isOpen) {
                            subtasksPanel.classList.add("hidden");
                            toggleBtn.textContent = "▶";
                        } else {
                            renderSubtasksPanel(task, subtasksPanel, deleteBtn);
                            subtasksPanel.classList.remove("hidden");
                            toggleBtn.textContent = "▼";
                        }
                    });
                }
            }
        }
        taskList.appendChild(li);
    });
}

function renderSubtasksPanel(task, panel, completeBtn) {
    if (!task.subtasks) task.subtasks = [];
    panel.innerHTML = "";

    // Render existing subtask items
    task.subtasks.forEach((sub) => {
        const row = document.createElement("div");
        row.className = "task-subtask-item";
        row.innerHTML = `
            <input type="checkbox" class="task-subtask-checkbox" ${sub.done ? 'checked' : ''}>
            <span class="task-subtask-text${sub.done ? ' task-subtask-text--done' : ''}">${sub.text}</span>
        `;
        const cb = row.querySelector(".task-subtask-checkbox");
        cb.addEventListener("change", () => {
            sub.done = cb.checked;
            touchState();
            persistAndRender();
        });
        panel.appendChild(row);
    });

    // Add-subtask row
    const addRow = document.createElement("div");
    addRow.className = "task-subtask-add";
    addRow.innerHTML = `
        <input type="text" class="task-subtask-input" placeholder="New subtask…" maxlength="200">
        <button class="task-subtask-add-btn" title="Add subtask">+</button>
    `;
    const subInput = addRow.querySelector(".task-subtask-input");
    const addBtn = addRow.querySelector(".task-subtask-add-btn");

    function addSubtask() {
        const text = subInput.value.trim();
        if (!text) return;
        if (!task.subtasks) task.subtasks = [];
        task.subtasks.push({
            id: `tsub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            text,
            done: false
        });
        touchState();
        persistAndRender();
    }

    addBtn.addEventListener("click", addSubtask);
    subInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") addSubtask();
    });

    panel.appendChild(addRow);

    // Update complete button glow state
    if (completeBtn) {
        const allDone = task.subtasks.length > 0 && task.subtasks.every(s => s.done);
        completeBtn.classList.toggle("delete-btn--glow", allDone);
    }
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

// ─── Productivity Score ────────────────────────────────────────────────────────
function computeProductivityScore(s, referenceDate) {
    // referenceDate: Date object for "today" (defaults to now); used so we can
    // compute last-week's score by shifting the reference back 7 days.
    const now = referenceDate || new Date();
    const todayStr = now.toISOString().slice(0, 10);

    // Derive the Monday of the week containing `now`
    function getMondayOf(d) {
        const day = d.getDay() || 7; // 1=Mon … 7=Sun
        const m = new Date(d);
        m.setDate(m.getDate() - (day - 1));
        m.setHours(0, 0, 0, 0);
        return m;
    }

    const weekStart = getMondayOf(now);
    const weekEnd   = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // ── Streak (20%) ──────────────────────────────────────────────────────────
    const streakDays = s.profile ? (s.profile.streakDays || 0) : 0;
    const streakScore = Math.min(streakDays / 14, 1) * 100;

    // ── Task completion rate this week (30%) ──────────────────────────────────
    const tasks = Array.isArray(s.tasks) ? s.tasks : [];
    const tasksCreatedThisWeek = tasks.filter(t => {
        if (!t.createdAt) return false;
        const d = new Date(t.createdAt);
        return d >= weekStart && d <= weekEnd;
    });
    const tasksCompletedThisWeek = tasks.filter(t => {
        if (t.status !== "completed" || !t.completedAt) return false;
        const d = new Date(t.completedAt);
        return d >= weekStart && d <= weekEnd;
    });
    const taskScore = (tasksCompletedThisWeek.length / Math.max(tasksCreatedThisWeek.length, 1)) * 100;

    // ── Habit rate today (20%) ────────────────────────────────────────────────
    const habits = Array.isArray(s.habits) ? s.habits : [];
    const habitsCompletedToday = habits.filter(h =>
        Array.isArray(h.completedDates) && h.completedDates.includes(todayStr)
    ).length;
    const habitScore = (habitsCompletedToday / Math.max(habits.length, 1)) * 100;

    // ── Focus sessions this week (15%) ────────────────────────────────────────
    const sessions = (s.focus && Array.isArray(s.focus.sessions)) ? s.focus.sessions : [];
    const focusThisWeek = sessions.filter(sess => {
        if (!sess.date) return false;
        const d = new Date(sess.date);
        return d >= weekStart && d <= weekEnd;
    }).length;
    const focusScore = Math.min(focusThisWeek / 5, 1) * 100;

    // ── Mood average this week (15%) ──────────────────────────────────────────
    const moodEntries = Array.isArray(s.mood) ? s.mood : [];
    const moodThisWeek = moodEntries.filter(e => {
        if (!e.date) return false;
        return e.date >= weekStart.toISOString().slice(0, 10) && e.date <= weekEnd.toISOString().slice(0, 10);
    });
    const moodScore = moodThisWeek.length > 0
        ? (moodThisWeek.reduce((sum, e) => sum + (e.energy || 0), 0) / moodThisWeek.length) / 5 * 100
        : 50;

    // ── Weighted blend ────────────────────────────────────────────────────────
    const score = Math.round(
        streakScore * 0.20 +
        taskScore   * 0.30 +
        habitScore  * 0.20 +
        focusScore  * 0.15 +
        moodScore   * 0.15
    );

    return {
        score: Math.min(100, Math.max(0, score)),
        breakdown: { streakScore, taskScore, habitScore, focusScore, moodScore }
    };
}

function getProductivityTrend(s) {
    const thisWeek = computeProductivityScore(s);
    // Compute last week: shift reference date back 7 days
    const lastWeekRef = new Date();
    lastWeekRef.setDate(lastWeekRef.getDate() - 7);
    const lastWeek = computeProductivityScore(s, lastWeekRef);
    const delta = thisWeek.score - lastWeek.score;
    const trend = delta > 3 ? 'up' : delta < -3 ? 'down' : 'same';
    return { score: thisWeek.score, trend, breakdown: thisWeek.breakdown };
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

    // Productivity Score
    const psEl = el("productivity-score");
    if (psEl) {
        const { score, trend } = getProductivityTrend(state);
        const numEl   = psEl.querySelector(".productivity-score-number");
        const trendEl = psEl.querySelector(".productivity-score-trend");
        if (numEl) numEl.textContent = score;
        if (trendEl) {
            const arrows = { up: '↑', down: '↓', same: '→' };
            trendEl.textContent = arrows[trend] || '→';
            trendEl.dataset.trend = trend;
        }
    }

    renderShip(state.profile.level);

    // Class badge
    const classBadgeEl = document.getElementById('class-badge');
    if (classBadgeEl) {
        const classInfo = CLASS_DEFINITIONS[state.profile.class];
        if (classInfo) {
            classBadgeEl.textContent = `${classInfo.emoji} ${classInfo.name}`;
            classBadgeEl.classList.remove('hidden');
        } else {
            classBadgeEl.classList.add('hidden');
        }
    }

    // Prestige stars
    const prestigeStarsEl = el('prestige-stars');
    if (prestigeStarsEl) {
        const count = state.profile.prestige ?? 0;
        if (count > 0) {
            prestigeStarsEl.textContent = '⭐'.repeat(Math.min(count, 10)) + (count > 10 ? ` ×${count}` : '');
            prestigeStarsEl.classList.remove('hidden');
        } else {
            prestigeStarsEl.classList.add('hidden');
        }
    }

    // Prestige button visibility
    const prestigeBtn = el('prestige-btn');
    if (prestigeBtn) {
        prestigeBtn.classList.toggle('hidden', state.profile.level < 20);
    }
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
            const currentHour = new Date().getHours();
            if (currentHour >= 18) {
                insights.push({
                    type: "warning",
                    emoji: "⚠️",
                    message: `Your ${streak}-day streak ends at midnight — complete a mission now to keep it alive!`
                });
            } else {
                insights.push({
                    type: "warning",
                    emoji: "⚠️",
                    message: `Your ${streak}-day streak is at risk — complete a task today!`
                });
            }
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

    // ── Crew quips ────────────────────────────────────────────────────────────
    const crewUnlocked = Array.isArray(s.crew) ? s.crew : [];
    if (crewUnlocked.length > 0) {
        // Pick a crew member quip based on day-of-week rotation
        const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
        const unlockedMembers = CREW_ROSTER.filter(m => crewUnlocked.includes(m.id));
        const member = unlockedMembers[dayOfYear % unlockedMembers.length];
        insights.push({ type: "crew", emoji: member.emoji, message: member.quip });
    }

    return insights.slice(0, 6);
}

function renderEventBanner() {
    const banner = document.getElementById('event-banner');
    if (!banner) return;
    const event = getActiveEvent();
    if (event) {
        banner.querySelector('.event-banner-emoji').textContent  = event.emoji;
        banner.querySelector('.event-banner-name').textContent   = event.name;
        banner.querySelector('.event-banner-desc').textContent   = event.description;
        banner.querySelector('.event-banner-bonus').textContent  = event.bonusText;
        banner.classList.remove('hidden');
    } else {
        banner.classList.add('hidden');
    }
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

// ─── Streak Notification Permission ──────────────────────────────────────────
function requestStreakNotificationPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;
    if (localStorage.getItem('moonNotifAsked')) return;
    localStorage.setItem('moonNotifAsked', '1');
    Notification.requestPermission();
}

// ─── Streak Warning Notification ──────────────────────────────────────────────
function checkStreakWarning() {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const streakDays = state.profile ? (state.profile.streakDays || 0) : 0;
    if (streakDays === 0) return;

    const today = new Date().toISOString().slice(0, 10);
    const currentHour = new Date().getHours();
    if (currentHour < 18) return;

    const notifKey = `moonStreakNotifSent-${today}`;
    if (localStorage.getItem(notifKey)) return;

    const allTasks = Array.isArray(state.tasks) ? state.tasks : [];
    const completedToday = allTasks.some(
        t => t.status === 'completed' && t.completedAt && t.completedAt.slice(0, 10) === today
    );
    if (completedToday) return;

    localStorage.setItem(notifKey, '1');
    new Notification('⚠️ Streak at Risk!', {
        body: `Your ${streakDays}-day streak ends at midnight. Complete a mission to keep it alive!`,
        icon: '/icon.svg'
    });
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
        const isSelected = (epic.id === selectedEpicId);
        
        const card = document.createElement("div");
        card.className = "epic-card";
        if (isSelected) {
            card.style.border = "1px solid var(--accent)";
            card.style.background = "var(--bg-card-hover)";
        }
        if (epic.completedAt) {
            card.style.opacity = "0.7";
        }

        let subtasksHtml = "";
        if (epic.subtasks.length > 0) {
            subtasksHtml = '<div class="epic-subtasks-list" style="margin-top: 12px; margin-bottom: 12px;">';
            epic.subtasks.forEach(s => {
                const subStr = s.text.replace(/"/g, '&quot;');
                subtasksHtml += `
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <input type="checkbox" class="epic-sub-cb" data-epicid="${epic.id}" data-subid="${s.id}" ${s.completed ? 'checked' : ''} ${epic.completedAt ? 'disabled' : ''}>
                        <span style="${s.completed ? 'text-decoration:line-through;color:var(--text-secondary);' : 'color:var(--text-primary);'}">${subStr}</span>
                    </div>
                `;
            });
            subtasksHtml += '</div>';
        }

        card.innerHTML = `
            <strong style="font-size:16px; ${epic.completedAt ? 'text-decoration:line-through;' : ''}">${epic.title} ${epic.completedAt ? '✓' : ''}</strong>
            <div class="hud-sub" style="margin-top:4px">${completed}/${total} subtasks completed</div>
            <div class="epic-progress"><div style="width:${progress}%"></div></div>
            ${subtasksHtml}
            <div class="epic-actions">
                <button data-epic="${epic.id}" class="select-epic btn-secondary">${isSelected ? 'Selected' : 'Select'}</button>
                <button data-epic="${epic.id}" class="complete-epic btn-primary" ${epic.completedAt ? 'disabled' : ''}>Complete</button>
                <button data-epic="${epic.id}" class="hof-epic btn-secondary">→ Hall of Fame</button>
            </div>
        `;

        // Bind subtask checkboxes
        card.querySelectorAll(".epic-sub-cb").forEach(cb => {
            cb.addEventListener("change", (e) => {
                const eId = e.target.getAttribute("data-epicid");
                const sId = e.target.getAttribute("data-subid");
                const ep = state.epics.find(epi => epi.id === eId);
                if (ep) {
                    const sub = ep.subtasks.find(sb => sb.id === sId);
                    if (sub) {
                        sub.completed = e.target.checked;
                        touchState();
                        persistAndRender();
                    }
                }
            });
        });

        card.querySelector(".select-epic").addEventListener("click", () => {
            selectedEpicId = epic.id;
            epicHint.innerText = `Selected: ${epic.title}`;
            renderEpics();
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
    let text = taskInput.value.trim();
    if (!text) return;
    
    if (window.APP && window.APP.parseNaturalTask) {
        text = window.APP.parseNaturalTask(text).title; // Strip keywords like "tomorrow"
    }

    const rawEstimate = taskEstimateInput ? parseInt(taskEstimateInput.value, 10) : NaN;
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
        dueDate: taskDueInput.value || null,
        recur: taskRecurSelect ? taskRecurSelect.value : 'none',
        estimateMins: (!isNaN(rawEstimate) && rawEstimate > 0) ? rawEstimate : null
    };
    state.tasks.push(task);
    taskInput.value = "";
    taskDueInput.value = "";
    if (taskRecurSelect) taskRecurSelect.value = 'none';
    if (taskEstimateInput) {
        taskEstimateInput.value = "";
        document.querySelectorAll(".estimate-quick-btn").forEach(b => b.classList.remove("active"));
    }
    touchState();
    persistAndRender();
}

// ─── Equipment Bonuses (delegates to loot module once loaded) ─────────────────
function getEquipmentBonuses() {
    // loot.js registers window.APP.getEquipmentBonuses after it loads.
    // Provide a safe fallback for the case where it hasn't loaded yet.
    if (typeof window.APP.getEquipmentBonuses === 'function') {
        return window.APP.getEquipmentBonuses(state);
    }
    return { xpBonus: 1.0, lootRate: 0.15, streakShield: false, focusBonus: 0 };
}

function completeTask(taskId) {
    const task = state.tasks.find((t) => t.id === taskId);
    if (!task) return;
    task.status = "completed";
    task.completedAt = new Date().toISOString();
    updateStats(task);
    updateStreak(task.completedAt);

    // Apply equipment passive XP bonus
    const equipBonuses = getEquipmentBonuses();
    let xpAmount = Math.round(task.xpValue * equipBonuses.xpBonus);

    // Apply consumable XP boost if one is active (stacks on top of equipment bonus)
    if (state.loot?.activeBoost?.type === 'xp2x') {
        xpAmount = xpAmount * 2;
        state.loot.activeBoost = null; // consume after one task
    }

    // ── Seasonal event bonuses ────────────────────────────────────────────────
    const activeEvent = getActiveEvent();
    let seasonalLootGuaranteed = false;
    let seasonalLootBoostRate  = 0;
    if (activeEvent) {
        switch (activeEvent.type) {
            case 'xp2x':
                xpAmount = xpAmount * 2;
                break;
            case 'xp1_5x':
                xpAmount = Math.round(xpAmount * 1.5);
                break;
            case 'loot_boost':
                seasonalLootBoostRate = 0.60; // will override base drop chance
                break;
            case 'learning_boost':
                if (task.category === 'learning') xpAmount = xpAmount * 2;
                break;
            case 'halloween':
                xpAmount = Math.round(xpAmount * 1.2);
                break;
            case 'xmas':
                xpAmount = xpAmount * 2;
                seasonalLootGuaranteed = true;
                break;
        }
    }

    // ── Class bonuses ────────────────────────────────────────────────────────
    const playerClass = state.profile.class;
    let classBonus = 0;
    if (playerClass === 'warrior' && task.difficulty === 'hard') {
        classBonus = Math.round(xpAmount * 0.5);
        showClassBonusToast('⚔️', 'Warrior', classBonus);
    } else if (playerClass === 'mage' && (task.category === 'learning' || task.category === 'work')) {
        classBonus = xpAmount; // double XP = +100%
        showClassBonusToast('🔮', 'Mage', classBonus);
    } else if (playerClass === 'rogue') {
        const streakBlocks = Math.min(5, Math.floor(state.profile.streakDays / 7)); // max 5 blocks = +50%
        if (streakBlocks > 0) {
            classBonus = Math.round(xpAmount * streakBlocks * 0.1);
            showClassBonusToast('🗡️', 'Rogue', classBonus);
        }
    } else if (playerClass === 'explorer') {
        classBonus = Math.round(xpAmount * 0.15);
        showClassBonusToast('🧭', 'Explorer', classBonus);
        // +20% loot drop chance (stacks on top of equipment loot rate)
        const baseDrop = equipBonuses.lootRate;
        const explorerDrop = baseDrop + 0.20;
        if (Math.random() < explorerDrop && state.loot && Array.isArray(state.loot.inventory)) {
            const template = DAILY_REWARD_LOOT_TABLE[Math.floor(Math.random() * DAILY_REWARD_LOOT_TABLE.length)];
            if (template) {
                state.loot.inventory.push({
                    id: 'loot_drop_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
                    name: template.name,
                    emoji: template.emoji,
                    rarity: template.rarity,
                    desc: template.desc,
                    earnedAt: new Date().toISOString(),
                });
            }
        }
    }
    xpAmount += classBonus;

    gainXP(xpAmount);

    // ── Seasonal loot drops ───────────────────────────────────────────────────
    if (state.loot && Array.isArray(state.loot.inventory)) {
        let dropChance = equipBonuses.lootRate; // base drop chance (equipment-aware)
        if (seasonalLootBoostRate > 0) dropChance = seasonalLootBoostRate;
        if (seasonalLootGuaranteed || Math.random() < dropChance) {
            const template = DAILY_REWARD_LOOT_TABLE[Math.floor(Math.random() * DAILY_REWARD_LOOT_TABLE.length)];
            if (template) {
                state.loot.inventory.push({
                    id: 'loot_seasonal_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
                    name: template.name,
                    emoji: template.emoji,
                    rarity: template.rarity,
                    desc: template.desc,
                    earnedAt: new Date().toISOString(),
                });
            }
        }
    }

    checkAchievements();
    checkChallenges();

    // Recurrence: spawn a new task with an updated due date
    if (task.recur && task.recur !== 'none') {
        const offsets = { daily: 1, weekly: 7, monthly: 30 };
        const daysAhead = offsets[task.recur] || 0;
        const nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + daysAhead);
        const nextDue = nextDate.toISOString().slice(0, 10);
        const spawned = {
            id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            text: task.text,
            category: task.category,
            difficulty: task.difficulty,
            priority: task.priority,
            recur: task.recur,
            status: 'active',
            createdAt: new Date().toISOString(),
            completedAt: null,
            xpValue: task.xpValue,
            dueDate: nextDue
        };
        state.tasks.push(spawned);
    }

    touchState();
    persistAndRender();
    // Fire task-complete hooks for feature modules
    window.APP.taskCompleteHooks.forEach(fn => { try { fn(task); } catch(e) {} });
}

function addEpic() {
    const title = epicInput.value.trim();
    if (!title) return;
    const newId = `epic_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    state.epics.push({
        id: newId,
        title,
        subtasks: [],
        createdAt: new Date().toISOString(),
        completedAt: null
    });
    selectedEpicId = newId;
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
    showToast(`Mission Complete: ${epic.title}`);
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
    showToast("Added to Hall of Fame!");
    showPage("hall");
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

async function addHofAI() {
    const btn = document.getElementById("hof-ai");
    const original = btn.textContent;
    btn.textContent = "✦ Generating…";
    btn.disabled = true;

    // Build a context summary to feed the AI
    const ctx = [
        state.profile.level > 1 ? `Level ${state.profile.level}` : null,
        state.profile.streakDays > 0 ? `${state.profile.streakDays}-day streak` : null,
        state.stats?.totalCompletions ? `${state.stats.totalCompletions} missions completed` : null,
        state.profile.class ? `Class: ${state.profile.class}` : null,
    ].filter(Boolean).join(", ") || "a dedicated astronaut";

    let token;
    const authToken = config.storage.authToken;
    if (authToken) {
        try {
            const res = await fetch(`${config.storage.baseUrl}/api/tokens/generate`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
                body: JSON.stringify({ title: ctx })
            });
            if (res.ok) {
                const data = await res.json();
                token = { ...generateAIToken(), title: data.title, description: data.description };
            }
        } catch (_) {}
    }
    // Fallback to local generation if server call failed or user is offline
    if (!token) token = generateAIToken();

    state.hallOfFame.push(token);
    touchState();
    persistAndRender();

    btn.textContent = "✓ Token minted!";
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
    const multiplier = state.profile.prestigeMultiplier ?? 1.0;
    const scaled = amount > 0 ? Math.round(amount * multiplier) : amount;
    const prevLevel = state.profile.level;
    state.profile.xp += scaled;
    while (state.profile.xp >= 100) {
        state.profile.xp -= 100;
        state.profile.level += 1;
    }
    // Clamp XP to 0 (no level-down on negative habits)
    if (state.profile.xp < 0) state.profile.xp = 0;
    // Trigger class selection if newly eligible
    if (state.profile.level >= 5 && state.profile.class === null) {
        setTimeout(showClassSelectionModal, 400);
    }
    // Trigger crew unlocks for any levels crossed
    if (state.profile.level > prevLevel) {
        checkCrewUnlocks(prevLevel, state.profile.level);
    }
    // Trigger prestige button visibility update
    const prestigeBtn = document.getElementById('prestige-btn');
    if (prestigeBtn) {
        prestigeBtn.classList.toggle('hidden', state.profile.level < 20);
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
        loadEntitlements();
        loadFriends();
        loadCommunityChallenges();
        checkMoodPrompt();
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

// ─── General Toast ────────────────────────────────────────────────────────────
let _toastTimer = null;
function showToast(msg, duration = 3000) {
    const el = document.getElementById("app-toast");
    if (!el) return;
    el.textContent = msg;
    el.classList.add("visible");
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => el.classList.remove("visible"), duration);
}

// ─── Nav Labels ───────────────────────────────────────────────────────────────
const NAV_LABELS = {
    dashboard: "Home", missions: "Missions", epics: "Epics",
    achievements: "Awards", hall: "Hall", profile: "Profile",
    pro: "Pro", roadmap: "Roadmap", habits: "Habits",
    focus: "Focus", quests: "Quests", stats: "Stats",
    skills: "Skills", loot: "Loot", mood: "Mood", calendar: "Calendar",
};
document.querySelectorAll(".nav-item[data-page]").forEach(btn => {
    const span = document.createElement("span");
    span.className = "nav-label";
    span.textContent = NAV_LABELS[btn.dataset.page] || btn.dataset.tooltip || "";
    btn.appendChild(span);
});

// ─── Mobile More Sheet ────────────────────────────────────────────────────────
(function initMoreSheet() {
    const overlay = document.getElementById("more-sheet-overlay");
    const grid    = document.getElementById("more-sheet-grid");
    const moreBtn = document.getElementById("nav-more-btn");
    if (!overlay || !grid || !moreBtn) return;

    // Build sheet items from non-primary nav buttons
    const nonPrimary = [...document.querySelectorAll(".nav-item[data-page]:not([data-mobile-primary])")];
    nonPrimary.forEach(btn => {
        const item = document.createElement("button");
        item.className = "more-sheet-item";
        item.dataset.page = btn.dataset.page;
        item.innerHTML = btn.querySelector(".nav-icon").outerHTML +
            `<span>${NAV_LABELS[btn.dataset.page] || btn.dataset.tooltip}</span>`;
        item.addEventListener("click", () => {
            showPage(btn.dataset.page);
            closeMoreSheet();
        });
        grid.appendChild(item);
    });

    moreBtn.addEventListener("click", () => overlay.classList.add("open"));
    overlay.addEventListener("click", (e) => { if (e.target === overlay) closeMoreSheet(); });

    function closeMoreSheet() { overlay.classList.remove("open"); }
    window.closeMoreSheet = closeMoreSheet;
})();

// ─── Onboarding ───────────────────────────────────────────────────────────────
(function initOnboarding() {
    if (localStorage.getItem("moonOnboarded")) return;
    const overlay = document.getElementById("onboard-overlay");
    if (!overlay) return;

    let step = 1;
    const totalSteps = 3;

    function show() { overlay.classList.add("open"); }
    function dismiss() {
        overlay.classList.remove("open");
        localStorage.setItem("moonOnboarded", "1");
    }
    function goTo(n) {
        overlay.querySelectorAll(".onboard-step").forEach(s => s.classList.remove("active"));
        overlay.querySelectorAll(".onboard-dot").forEach(d => d.classList.remove("active"));
        const stepEl = overlay.querySelector(`.onboard-step[data-step="${n}"]`);
        const dotEl  = overlay.querySelector(`.onboard-dot[data-dot="${n}"]`);
        if (stepEl) stepEl.classList.add("active");
        if (dotEl)  dotEl.classList.add("active");
        const nextBtn = document.getElementById("onboard-next");
        if (nextBtn) nextBtn.textContent = n < totalSteps ? "Next →" : "Let's Go! 🚀";
    }

    document.getElementById("onboard-skip")?.addEventListener("click", dismiss);
    document.getElementById("onboard-next")?.addEventListener("click", () => {
        step < totalSteps ? goTo(++step) : dismiss();
    });

    // Show only after app shell is visible (first login check deferred)
    const origShowApp = window.showAppShell;
    setTimeout(() => {
        if (!localStorage.getItem("moonOnboarded")) show();
    }, 4000);
})();

// ─── Friends System ───────────────────────────────────────────────────────────
async function loadFriends() {
    const token = config.storage.authToken;
    if (!token) return;
    try {
        const [frRes, pendRes] = await Promise.all([
            fetch(`${config.storage.baseUrl}/api/friends`, { headers: { Authorization: `Bearer ${token}` } }),
            fetch(`${config.storage.baseUrl}/api/friends/pending`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        const { friends = [] }  = frRes.ok   ? await frRes.json()   : {};
        const { pending = [] }  = pendRes.ok  ? await pendRes.json() : {};
        renderFriends(friends, pending);
    } catch (_) {}
}

function renderFriends(friends, pending) {
    const el = document.getElementById("friends-list");
    if (!el) return;

    let html = "";
    if (pending.length) {
        html += `<div class="section-label" style="margin:12px 0 8px;font-size:11px">Pending Invites</div>`;
        pending.forEach(inv => {
            html += `<div class="pending-invite-item">
                <span class="pending-from">🛸 Invite from <strong>${inv.from_email}</strong></span>
                <button class="btn-secondary" style="padding:5px 14px;font-size:12px" onclick="acceptInvite('${inv.id}')">Accept</button>
            </div>`;
        });
    }
    if (friends.length) {
        html += `<div class="section-label" style="margin:12px 0 8px;font-size:11px">Crew</div>`;
        friends.forEach(f => {
            html += `<div class="friend-item"><span class="friend-email">🧑‍🚀 ${f.friend_email}</span></div>`;
        });
    }
    if (!friends.length && !pending.length) {
        html = `<div class="hint-row">No crew yet — invite a friend above.</div>`;
    }
    el.innerHTML = html;
}

async function sendFriendInvite() {
    const emailEl = document.getElementById("invite-email");
    const email = emailEl?.value.trim();
    if (!email) return;
    const token = config.storage.authToken;
    if (!token) { showToast("Sign in to invite friends."); return; }
    try {
        const res = await fetch(`${config.storage.baseUrl}/api/friends/invite`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ toEmail: email })
        });
        if (res.ok) {
            showToast(`Invite sent to ${email}!`);
            if (emailEl) emailEl.value = "";
        } else {
            showToast("Could not send invite.");
        }
    } catch (_) { showToast("Could not send invite."); }
}

async function acceptInvite(inviteId) {
    const token = config.storage.authToken;
    if (!token) return;
    try {
        const res = await fetch(`${config.storage.baseUrl}/api/friends/accept`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ inviteId })
        });
        if (res.ok) { showToast("Crew member added!"); loadFriends(); }
        else showToast("Could not accept invite.");
    } catch (_) {}
}

document.getElementById("invite-btn")?.addEventListener("click", sendFriendInvite);

// ─── Community Challenges ─────────────────────────────────────────────────────
async function loadCommunityChallenges() {
    const token = config.storage.authToken;
    if (!token) return;
    try {
        const res = await fetch(`${config.storage.baseUrl}/api/challenges/community`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const { challenges } = await res.json();
        renderCommunityChallenges(challenges);
    } catch (_) {}
}

function renderCommunityChallenges(challenges) {
    let el = document.getElementById("community-challenge-list");
    if (!el) return;
    if (!challenges.length) {
        el.innerHTML = `<div class="hint-row">No community challenges yet. Share one!</div>`;
        return;
    }
    el.innerHTML = challenges.map(ch => `
        <div class="community-challenge-item">
            <div class="community-challenge-info">
                <div class="community-challenge-title">${ch.title}</div>
                <div class="community-challenge-meta">${ch.goal} · ${ch.members} member${ch.members !== 1 ? "s" : ""}</div>
            </div>
            <button class="btn-secondary" style="padding:5px 14px;font-size:12px;flex-shrink:0" onclick="joinCommunityChallenge('${ch.id}')">Join</button>
        </div>
    `).join("");
}

async function joinCommunityChallenge(challengeId) {
    const token = config.storage.authToken;
    if (!token) { showToast("Sign in to join challenges."); return; }
    try {
        const res = await fetch(`${config.storage.baseUrl}/api/challenges/join`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ challengeId })
        });
        if (res.ok) { showToast("Joined challenge!"); loadCommunityChallenges(); }
        else showToast("Could not join challenge.");
    } catch (_) {}
}

// ─── Entitlements & Pro Checkout ──────────────────────────────────────────────
async function loadEntitlements() {
    const token = config.storage.authToken;
    if (!token) return;
    try {
        const res = await fetch(`${config.storage.baseUrl}/api/entitlements`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const { features } = await res.json();
        Object.assign(config.premium, features);
        renderPro();
    } catch (_) {}
}

async function startCheckout(plan) {
    const token = config.storage.authToken;
    if (!token) { showToast("Sign in to upgrade."); return; }
    try {
        const res = await fetch(`${config.storage.baseUrl}/api/checkout`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ plan })
        });
        const data = await res.json();
        if (data.url) {
            window.location.href = data.url;
        } else {
            showToast(data.error === "stripe_not_configured" ? "Payments not configured yet." : "Checkout failed.");
        }
    } catch (_) {
        showToast("Could not start checkout.");
    }
}

function renderPro() {
    document.querySelectorAll(".premium-card[data-feature]").forEach(card => {
        const feature = card.dataset.feature;
        const unlocked = !!config.premium[feature];
        card.classList.toggle("locked", !unlocked);
        card.classList.toggle("unlocked", unlocked);
        const btn = card.querySelector(".btn-premium");
        if (btn) {
            btn.textContent = unlocked ? "✓ Active" : "Upgrade ✦";
            btn.disabled = unlocked;
        }
    });
}

// Wire Upgrade buttons — read plan from card's data-plan or default to commander
document.getElementById("page-pro").addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-premium");
    if (!btn || btn.disabled) return;
    const plan = btn.closest("[data-plan]")?.dataset.plan || "commander";
    startCheckout(plan);
});

// Handle return from Stripe checkout
(function handleCheckoutReturn() {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout") === "success") {
        history.replaceState({}, "", "/");
        setTimeout(() => {
            loadEntitlements();
            showToast("🎉 You're now Pro! Features unlocked.");
        }, 1000);
    } else if (params.get("checkout") === "cancel") {
        history.replaceState({}, "", "/");
    }
})();

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
    initGalaxy();
    initThemeSwitcher();

    try {
        const loaded = await storage.load();
        state = normalizeState(loaded && loaded.state ? loaded.state : loaded);
    } catch (err) {
        state = { ...defaultState };
    }

    const todayStr = new Date().toISOString().split("T")[0];
    if (!state.profile.loginDays.includes(todayStr)) {
        state.profile.loginDays.push(todayStr);
        if (typeof touchState === "function") touchState();
        if (typeof persistAndRender === "function") {
            // Delay persistence slightly so everything is bound
            setTimeout(() => APP.persist(), 500);
        }
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
        loadEntitlements();
        loadFriends();
        loadCommunityChallenges();
        checkMoodPrompt();
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

function checkMoodPrompt() {
    setTimeout(() => {
        const today = new Date().toISOString().slice(0, 10);
        const hasMood = state.mood && state.mood.some(m => m.date === today);
        if (!hasMood) {
            showPage("mood");
            showToast("Welcome back! Please check-in your mood.", "info");
        }
    }, 1500);
}

init();
