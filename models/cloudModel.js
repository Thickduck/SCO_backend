import db from '../database/connection.js';

export const CloudModel = {
  getUserByEmail: (email) => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM users WHERE email = ?`, [email], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  createUser: (userId, email, password, name, role) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (user_id, email, password, name, role) VALUES (?, ?, ?, ?, ?)`,
        [userId, email, password, name, role || 'engineer'],
        function(err) {
          if (err) reject(err);
          else resolve({ user_id: userId, email, name, role: role || 'engineer' });
        }
      );
    });
  },

  getAllInventory: () => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM inventory`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  getMetricsForResource: (id) => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM metrics WHERE resource_id = ? ORDER BY timestamp DESC LIMIT 50`, [id], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  getAllRecommendations: () => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM recommendations`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};