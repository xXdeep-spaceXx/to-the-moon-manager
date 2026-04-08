const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data', 'moon.db');

if (!fs.existsSync(dbPath)) {
    console.error(`❌ Database not found at \${dbPath}`);
    console.error('Make sure the server has run at least once and the DB is created.');
    process.exit(1);
}

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);

const query = `
    SELECT u.email, u.created_at as signup_date, s.updated_at as last_sync, s.state_json
    FROM users u
    LEFT JOIN states s ON u.id = s.user_id
    ORDER BY u.created_at DESC
`;

db.all(query, [], (err, rows) => {
    if (err) {
        console.error('Error reading database:', err);
        process.exit(1);
    }

    if (!rows || rows.length === 0) {
        console.log('No users found in database.');
        process.exit(0);
    }

    const reportData = rows.map(row => {
        let xp = 0;
        let level = 1;
        let activeTasks = 0;
        let completedTasks = 0;
        let logins = 0;

        if (row.state_json) {
            try {
                const state = JSON.parse(row.state_json);
                xp = state.profile?.xp || 0;
                level = state.profile?.level || 1;
                
                if (Array.isArray(state.tasks)) {
                    activeTasks = state.tasks.filter(t => t.status === 'active').length;
                }
                
                completedTasks = state.stats?.totalCompletions || 0;
                
                if (Array.isArray(state.profile?.loginDays)) {
                    logins = state.profile.loginDays.length;
                }
            } catch (e) {
                console.error(`Error parsing state for \${row.email}:`, e.message);
            }
        }

        return {
            'User Email': row.email,
            'Level': level,
            'Total XP': xp,
            'Logins (Days)': logins || (row.state_json ? 1 : 0), // At least 1 if they have state
            'Active Tasks': activeTasks,
            'Completed Tasks': completedTasks,
            'Last Sync': row.last_sync ? new Date(row.last_sync).toLocaleString() : 'Never',
            'Signed Up': new Date(row.signup_date).toLocaleString()
        };
    });

    console.log('\n🚀 --- TO THE MOON MANAGER: BETA METRICS REPORT --- 🚀\n');
    console.table(reportData);
    console.log('\nRun this report occasionally to check retention and engagement.\n');
});

db.close();
