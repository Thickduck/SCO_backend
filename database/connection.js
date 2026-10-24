import duckdb from 'duckdb';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '../../DATABASE');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH
    ? path.resolve(process.cwd(), process.env.DB_PATH)
    : path.join(dbDir, 'local_metrics.duckdb');
const db = new duckdb.Database(dbPath);

const all = (sql, ...params) => new Promise((resolve, reject) => {
    db.all(sql, ...params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

const run = (sql, ...params) => new Promise((resolve, reject) => {
    db.run(sql, ...params, (err) => {
        if (err) reject(err);
        else resolve();
    });
});

export async function initializeDatabase() {
    await run(`CREATE TABLE IF NOT EXISTS company_settings (
        company_id VARCHAR PRIMARY KEY,
        name VARCHAR NOT NULL,
        website VARCHAR NOT NULL,
        industry VARCHAR NOT NULL,
        contact_email VARCHAR NOT NULL,
        address VARCHAR NOT NULL
    )`);

    const company = await all(`SELECT company_id FROM company_settings WHERE company_id = 'default'`);
    if (company.length === 0) {
        await run(`INSERT INTO company_settings VALUES ('default', 'Your Company', '', '', '', '')`);
    }

    const tables = await all(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'main' AND table_name = 'users'`);
    if (tables.length > 0) {
        const columns = await all(`PRAGMA table_info('users')`);
        if (!columns.some((column) => column.name === 'is_admin')) {
            await run(`ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT FALSE`);
            await run(`UPDATE users SET is_admin = TRUE WHERE user_id = 'usr-3' AND email = 'admin@cloud.com' AND role = 'leadership'`);
        }
    }
}

export default db;