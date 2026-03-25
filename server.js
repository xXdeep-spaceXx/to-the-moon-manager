const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();
const nodemailer = require("nodemailer");
const fetch = require("node-fetch");
const Stripe = require("stripe");

const app = express();
const port = process.env.PORT || 3030;
const dataDir = path.join(__dirname, "data");
const dbPath = path.join(dataDir, "moon.db");

const mailConfig = {
    host: process.env.SMTP_HOST || "",
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "no-reply@moonmanager.local"
};

const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: "2023-10-16" }) : null;

const openaiKey = process.env.OPENAI_API_KEY || "";
const openaiModel = process.env.OPENAI_MODEL || "gpt-4o-mini";

if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

function runMigrations(database) {
    const migrations = [
        {
            id: 1,
            name: "base_schema",
            up: [
                `CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )`,
                `CREATE TABLE IF NOT EXISTS tokens (
                    token TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )`,
                `CREATE TABLE IF NOT EXISTS states (
                    user_id TEXT PRIMARY KEY,
                    state_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )`,
                `CREATE TABLE IF NOT EXISTS password_resets (
                    email TEXT NOT NULL,
                    code TEXT NOT NULL,
                    expires_at TEXT NOT NULL
                )`,
                `CREATE TABLE IF NOT EXISTS profiles (
                    user_id TEXT PRIMARY KEY,
                    display_name TEXT NOT NULL,
                    tagline TEXT NOT NULL,
                    is_public INTEGER NOT NULL,
                    tokens_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )`,
                `CREATE TABLE IF NOT EXISTS entitlements (
                    user_id TEXT PRIMARY KEY,
                    features_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )`,
                `CREATE TABLE IF NOT EXISTS friend_invites (
                    id TEXT PRIMARY KEY,
                    from_user TEXT NOT NULL,
                    to_email TEXT NOT NULL,
                    status TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )`,
                `CREATE TABLE IF NOT EXISTS friends (
                    id TEXT PRIMARY KEY,
                    user_a TEXT NOT NULL,
                    user_b TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )`,
                `CREATE TABLE IF NOT EXISTS challenges (
                    id TEXT PRIMARY KEY,
                    owner_user TEXT NOT NULL,
                    title TEXT NOT NULL,
                    goal TEXT NOT NULL,
                    created_at TEXT NOT NULL
                )`,
                `CREATE TABLE IF NOT EXISTS challenge_members (
                    id TEXT PRIMARY KEY,
                    challenge_id TEXT NOT NULL,
                    user_id TEXT NOT NULL,
                    joined_at TEXT NOT NULL
                )`
            ]
        }
    ];

    database.serialize(() => {
        database.run(`CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY,
            name TEXT NOT NULL,
            applied_at TEXT NOT NULL
        )`);

        database.all("SELECT id FROM migrations", (err, rows) => {
            if (err) throw err;
            const applied = new Set(rows.map((r) => r.id));

            migrations.forEach((migration) => {
                if (applied.has(migration.id)) return;
                migration.up.forEach((stmt) => database.run(stmt));
                database.run(
                    "INSERT INTO migrations (id, name, applied_at) VALUES (?, ?, ?)",
                    [migration.id, migration.name, new Date().toISOString()]
                );
            });
        });
    });
}

runMigrations(db);

app.use(cors());
app.use(express.static(__dirname));

app.post("/api/webhook/stripe", express.raw({ type: "application/json" }), (req, res) => {
    if (!stripe || !stripeWebhookSecret) return res.status(400).send("stripe_not_configured");

    let event;
    try {
        event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], stripeWebhookSecret);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === "checkout.session.completed" || event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
        const data = event.data.object;
        const userId = data.metadata?.userId;
        const features = data.metadata?.features ? JSON.parse(data.metadata.features) : {};
        if (userId) {
            db.run(
                "INSERT INTO entitlements (user_id, features_json, updated_at) VALUES (?, ?, ?)\n                ON CONFLICT(user_id) DO UPDATE SET features_json=excluded.features_json, updated_at=excluded.updated_at",
                [userId, JSON.stringify(features), new Date().toISOString()]
            );
        }
    }

    res.json({ received: true });
});

app.use(express.json({ limit: "2mb" }));

function nowIso() {
    return new Date().toISOString();
}

function hashPassword(password, salt) {
    const hash = crypto.scryptSync(password, salt, 64).toString("hex");
    return `${salt}:${hash}`;
}

function verifyPassword(password, stored) {
    const [salt, hash] = stored.split(":");
    const test = crypto.scryptSync(password, salt, 64).toString("hex");
    return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(test, "hex"));
}

function requireAuth(req, res, next) {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "missing_token" });

    db.get("SELECT user_id FROM tokens WHERE token = ?", [token], (err, row) => {
        if (err) return res.status(500).json({ error: "db_error" });
        if (!row) return res.status(401).json({ error: "invalid_token" });
        req.userId = row.user_id;
        next();
    });
}

function createMailer() {
    if (!mailConfig.host || !mailConfig.user || !mailConfig.pass) {
        return null;
    }

    return nodemailer.createTransport({
        host: mailConfig.host,
        port: mailConfig.port,
        secure: mailConfig.secure,
        auth: {
            user: mailConfig.user,
            pass: mailConfig.pass
        }
    });
}

async function sendResetEmail(to, code) {
    const mailer = createMailer();
    if (!mailer) {
        console.log(`Password reset code for ${to}: ${code}`);
        return false;
    }

    await mailer.sendMail({
        from: mailConfig.from,
        to,
        subject: "Moon Manager password reset",
        text: `Your reset code is: ${code}`
    });
    return true;
}

async function generateTokenWithAI(title) {
    if (!openaiKey) return null;

    const prompt = `Create a legendary achievement token title and description for completing: ${title}. Keep it short.`;
    const body = {
        model: openaiModel,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 120
    };

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openaiKey}`
        },
        body: JSON.stringify(body)
    });

    if (!res.ok) return null;
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || "";
    return text;
}

app.get("/api/health", (req, res) => {
    res.json({ ok: true });
});

app.post("/api/signup", (req, res) => {
    const email = (req.body.email || "").toLowerCase();
    const password = req.body.password || "";

    if (!email || !password) return res.status(400).json({ error: "missing_fields" });

    const userId = `user_${crypto.randomBytes(8).toString("hex")}`;
    const salt = crypto.randomBytes(16).toString("hex");
    const passwordHash = hashPassword(password, salt);

    db.run(
        "INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
        [userId, email, passwordHash, nowIso()],
        (err) => {
            if (err) return res.status(400).json({ error: "user_exists" });
            res.json({ ok: true });
        }
    );
});

app.post("/api/login", (req, res) => {
    const email = (req.body.email || "").toLowerCase();
    const password = req.body.password || "";

    if (!email || !password) return res.status(400).json({ error: "missing_fields" });

    db.get("SELECT id, password_hash FROM users WHERE email = ?", [email], (err, row) => {
        if (err) return res.status(500).json({ error: "db_error" });
        if (!row) return res.status(401).json({ error: "invalid_credentials" });
        if (!verifyPassword(password, row.password_hash)) {
            return res.status(401).json({ error: "invalid_credentials" });
        }

        const token = `tok_${crypto.randomBytes(16).toString("hex")}`;
        db.run(
            "INSERT INTO tokens (token, user_id, created_at) VALUES (?, ?, ?)",
            [token, row.id, nowIso()],
            (tokenErr) => {
                if (tokenErr) return res.status(500).json({ error: "db_error" });
                res.json({ token, userId: row.id });
            }
        );
    });
});

app.post("/api/reset-request", (req, res) => {
    const email = (req.body.email || "").toLowerCase();
    if (!email) return res.status(400).json({ error: "missing_fields" });

    const code = crypto.randomBytes(3).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    db.run(
        "INSERT INTO password_resets (email, code, expires_at) VALUES (?, ?, ?)",
        [email, code, expiresAt],
        async (err) => {
            if (err) return res.status(500).json({ error: "db_error" });
            try {
                await sendResetEmail(email, code);
                res.json({ ok: true });
            } catch (mailErr) {
                console.error(mailErr);
                res.status(500).json({ error: "email_failed" });
            }
        }
    );
});

app.post("/api/reset-confirm", (req, res) => {
    const email = (req.body.email || "").toLowerCase();
    const code = req.body.code || "";
    const newPassword = req.body.newPassword || "";

    if (!email || !code || !newPassword) return res.status(400).json({ error: "missing_fields" });

    db.get(
        "SELECT code, expires_at FROM password_resets WHERE email = ? ORDER BY expires_at DESC LIMIT 1",
        [email],
        (err, row) => {
            if (err) return res.status(500).json({ error: "db_error" });
            if (!row) return res.status(400).json({ error: "invalid_code" });
            if (row.code !== code) return res.status(400).json({ error: "invalid_code" });
            if (new Date(row.expires_at) < new Date()) return res.status(400).json({ error: "expired_code" });

            const salt = crypto.randomBytes(16).toString("hex");
            const passwordHash = hashPassword(newPassword, salt);

            db.run(
                "UPDATE users SET password_hash = ? WHERE email = ?",
                [passwordHash, email],
                (updateErr) => {
                    if (updateErr) return res.status(500).json({ error: "db_error" });
                    res.json({ ok: true });
                }
            );
        }
    );
});

// Create a Stripe Checkout session and return the redirect URL
app.post("/api/checkout", requireAuth, async (req, res) => {
    if (!stripe) return res.status(400).json({ error: "stripe_not_configured" });

    const plan = req.body.plan || "";
    const priceId =
        plan === "commander" ? process.env.STRIPE_COMMANDER_PRICE_ID :
        plan === "legend"    ? process.env.STRIPE_LEGEND_PRICE_ID    : null;

    if (!priceId) return res.status(400).json({ error: "invalid_plan" });

    const appUrl = process.env.APP_URL || "http://localhost:3030";

    try {
        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${appUrl}/?checkout=success`,
            cancel_url:  `${appUrl}/?checkout=cancel`,
            metadata: { userId: req.userId },
        });
        res.json({ url: session.url });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get("/api/entitlements", requireAuth, (req, res) => {
    db.get("SELECT features_json FROM entitlements WHERE user_id = ?", [req.userId], (err, row) => {
        if (err) return res.status(500).json({ error: "db_error" });
        const features = row ? JSON.parse(row.features_json) : {};
        res.json({ features });
    });
});

app.post("/api/tokens/generate", requireAuth, async (req, res) => {
    const title = req.body.title || "";
    if (!title) return res.status(400).json({ error: "missing_title" });

    const aiText = await generateTokenWithAI(title);
    if (!aiText) {
        return res.json({ title: `Mission Complete: ${title}`, description: `You finished a major project: ${title}.` });
    }

    const lines = aiText.split("\n").filter(Boolean);
    const tokenTitle = lines[0].replace(/^Title:\s*/i, "") || `Mission Complete: ${title}`;
    const tokenDesc = lines.slice(1).join(" ").replace(/^Description:\s*/i, "") || `You finished a major project: ${title}.`;

    res.json({ title: tokenTitle, description: tokenDesc });
});

app.put("/api/profile", requireAuth, (req, res) => {
    const displayName = req.body.displayName || "";
    const tagline = req.body.tagline || "";
    const isPublic = req.body.isPublic ? 1 : 0;
    const tokensJson = JSON.stringify(req.body.tokens || []);

    db.run(
        "INSERT INTO profiles (user_id, display_name, tagline, is_public, tokens_json, updated_at) VALUES (?, ?, ?, ?, ?, ?)\n        ON CONFLICT(user_id) DO UPDATE SET display_name=excluded.display_name, tagline=excluded.tagline, is_public=excluded.is_public, tokens_json=excluded.tokens_json, updated_at=excluded.updated_at",
        [req.userId, displayName, tagline, isPublic, tokensJson, nowIso()],
        (err) => {
            if (err) return res.status(500).json({ error: "db_error" });
            res.json({ ok: true });
        }
    );
});

app.get("/api/similar", requireAuth, (req, res) => {
    db.all(
        "SELECT display_name, tagline, tokens_json FROM profiles WHERE is_public = 1 ORDER BY updated_at DESC LIMIT 5",
        (err, rows) => {
            if (err) return res.status(500).json({ error: "db_error" });
            const users = rows.map((row) => ({
                displayName: row.display_name,
                tagline: row.tagline,
                tokens: JSON.parse(row.tokens_json || "[]").length
            }));
            res.json({ users });
        }
    );
});

app.post("/api/friends/invite", requireAuth, (req, res) => {
    const toEmail = (req.body.email || "").toLowerCase();
    if (!toEmail) return res.status(400).json({ error: "missing_email" });

    const inviteId = `inv_${crypto.randomBytes(6).toString("hex")}`;
    db.run(
        "INSERT INTO friend_invites (id, from_user, to_email, status, created_at) VALUES (?, ?, ?, ?, ?)",
        [inviteId, req.userId, toEmail, "pending", nowIso()],
        (err) => {
            if (err) return res.status(500).json({ error: "db_error" });
            res.json({ ok: true, inviteId });
        }
    );
});

app.post("/api/friends/accept", requireAuth, (req, res) => {
    const inviteId = req.body.inviteId || "";
    if (!inviteId) return res.status(400).json({ error: "missing_invite" });

    db.get("SELECT from_user, to_email, status FROM friend_invites WHERE id = ?", [inviteId], (err, row) => {
        if (err) return res.status(500).json({ error: "db_error" });
        if (!row || row.status !== "pending") return res.status(400).json({ error: "invalid_invite" });

        db.run("UPDATE friend_invites SET status = ? WHERE id = ?", ["accepted", inviteId]);
        const friendId = `fr_${crypto.randomBytes(6).toString("hex")}`;
        db.run(
            "INSERT INTO friends (id, user_a, user_b, created_at) VALUES (?, ?, ?, ?)",
            [friendId, row.from_user, req.userId, nowIso()],
            (saveErr) => {
                if (saveErr) return res.status(500).json({ error: "db_error" });
                res.json({ ok: true });
            }
        );
    });
});

app.get("/api/friends", requireAuth, (req, res) => {
    db.all(
        `SELECT f.id, f.created_at,
            CASE WHEN f.user_a = ? THEN ub.email ELSE ua.email END AS friend_email
         FROM friends f
         JOIN users ua ON ua.id = f.user_a
         JOIN users ub ON ub.id = f.user_b
         WHERE f.user_a = ? OR f.user_b = ?`,
        [req.userId, req.userId, req.userId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: "db_error" });
            res.json({ friends: rows });
        }
    );
});

app.get("/api/friends/pending", requireAuth, (req, res) => {
    db.get("SELECT email FROM users WHERE id = ?", [req.userId], (err, user) => {
        if (err || !user) return res.status(500).json({ error: "db_error" });
        db.all(
            `SELECT fi.id, u.email AS from_email, fi.created_at
             FROM friend_invites fi
             JOIN users u ON u.id = fi.from_user
             WHERE fi.to_email = ? AND fi.status = 'pending'`,
            [user.email],
            (err2, rows) => {
                if (err2) return res.status(500).json({ error: "db_error" });
                res.json({ pending: rows });
            }
        );
    });
});

app.get("/api/challenges/community", requireAuth, (req, res) => {
    db.all(
        `SELECT c.id, c.title, c.goal, c.created_at,
            (SELECT COUNT(*) FROM challenge_members WHERE challenge_id = c.id) AS members
         FROM challenges c
         ORDER BY c.created_at DESC LIMIT 20`,
        [],
        (err, rows) => {
            if (err) return res.status(500).json({ error: "db_error" });
            res.json({ challenges: rows });
        }
    );
});

app.post("/api/challenges", requireAuth, (req, res) => {
    const title = req.body.title || "";
    const goal = req.body.goal || "";
    if (!title || !goal) return res.status(400).json({ error: "missing_fields" });

    const challengeId = `ch_${crypto.randomBytes(6).toString("hex")}`;
    db.run(
        "INSERT INTO challenges (id, owner_user, title, goal, created_at) VALUES (?, ?, ?, ?, ?)",
        [challengeId, req.userId, title, goal, nowIso()],
        (err) => {
            if (err) return res.status(500).json({ error: "db_error" });
            const memberId = `cm_${crypto.randomBytes(6).toString("hex")}`;
            db.run(
                "INSERT INTO challenge_members (id, challenge_id, user_id, joined_at) VALUES (?, ?, ?, ?)",
                [memberId, challengeId, req.userId, nowIso()],
                () => res.json({ ok: true, challengeId })
            );
        }
    );
});

app.get("/api/challenges", requireAuth, (req, res) => {
    db.all(
        "SELECT c.id, c.title, c.goal, c.created_at FROM challenges c JOIN challenge_members m ON c.id = m.challenge_id WHERE m.user_id = ?",
        [req.userId],
        (err, rows) => {
            if (err) return res.status(500).json({ error: "db_error" });
            res.json({ challenges: rows });
        }
    );
});

app.post("/api/challenges/join", requireAuth, (req, res) => {
    const challengeId = req.body.challengeId || "";
    if (!challengeId) return res.status(400).json({ error: "missing_challenge" });

    const memberId = `cm_${crypto.randomBytes(6).toString("hex")}`;
    db.run(
        "INSERT INTO challenge_members (id, challenge_id, user_id, joined_at) VALUES (?, ?, ?, ?)",
        [memberId, challengeId, req.userId, nowIso()],
        (err) => {
            if (err) return res.status(500).json({ error: "db_error" });
            res.json({ ok: true });
        }
    );
});

app.get("/api/state", requireAuth, (req, res) => {
    db.get("SELECT state_json, updated_at FROM states WHERE user_id = ?", [req.userId], (err, row) => {
        if (err) return res.status(500).json({ error: "db_error" });
        if (!row) return res.json(null);
        res.json({ state: JSON.parse(row.state_json), updatedAt: row.updated_at });
    });
});

app.put("/api/state", requireAuth, (req, res) => {
    const payload = req.body || {};
    const stateJson = JSON.stringify(payload.state || payload);
    const updatedAt = payload.updatedAt || nowIso();

    db.run(
        "INSERT INTO states (user_id, state_json, updated_at) VALUES (?, ?, ?)\n        ON CONFLICT(user_id) DO UPDATE SET state_json=excluded.state_json, updated_at=excluded.updated_at",
        [req.userId, stateJson, updatedAt],
        (err) => {
            if (err) return res.status(500).json({ error: "db_error" });
            res.json({ ok: true, updatedAt });
        }
    );
});

app.post("/api/sync", requireAuth, (req, res) => {
    const clientState = req.body.state || null;
    const clientUpdatedAt = req.body.updatedAt || null;

    db.get("SELECT state_json, updated_at FROM states WHERE user_id = ?", [req.userId], (err, row) => {
        if (err) return res.status(500).json({ error: "db_error" });

        if (!row) {
            if (!clientState) return res.json({ state: null, updatedAt: null, action: "noop" });
            const updatedAt = clientUpdatedAt || nowIso();
            db.run(
                "INSERT INTO states (user_id, state_json, updated_at) VALUES (?, ?, ?)",
                [req.userId, JSON.stringify(clientState), updatedAt],
                (saveErr) => {
                    if (saveErr) return res.status(500).json({ error: "db_error" });
                    res.json({ state: clientState, updatedAt, action: "uploaded" });
                }
            );
            return;
        }

        const serverUpdatedAt = row.updated_at;
        if (!clientUpdatedAt || serverUpdatedAt > clientUpdatedAt) {
            return res.json({ state: JSON.parse(row.state_json), updatedAt: serverUpdatedAt, action: "downloaded" });
        }

        if (clientState) {
            db.run(
                "UPDATE states SET state_json = ?, updated_at = ? WHERE user_id = ?",
                [JSON.stringify(clientState), clientUpdatedAt, req.userId],
                (saveErr) => {
                    if (saveErr) return res.status(500).json({ error: "db_error" });
                    res.json({ state: clientState, updatedAt: clientUpdatedAt, action: "uploaded" });
                }
            );
        } else {
            res.json({ state: JSON.parse(row.state_json), updatedAt: serverUpdatedAt, action: "downloaded" });
        }
    });
});

app.listen(port, () => {
    console.log(`Moon Manager API listening on http://localhost:${port}`);
});
