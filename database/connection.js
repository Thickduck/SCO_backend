const duckdb = require('duckdb');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../../DATABASE');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'local_metrics.duckdb');
const db = new duckdb.Database(dbPath);

module.exports = db;