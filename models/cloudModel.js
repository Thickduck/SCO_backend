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

  getResourceById: (id) => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT * FROM inventory WHERE resource_id = ?`, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  getInventoryStats: () => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          COUNT(*) as total_resources,
          SUM(monthly_cost) as total_monthly_cost,
          SUM(CASE WHEN type = 'VM' THEN 1 ELSE 0 END) as total_vms,
          SUM(CASE WHEN type = 'block-volume' THEN 1 ELSE 0 END) as total_volumes,
          SUM(CASE WHEN type = 'public-ip' THEN 1 ELSE 0 END) as total_ips
        FROM inventory
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row);
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

  getResourcePercentiles: (id) => {
    return new Promise((resolve, reject) => {
      db.get(`
        SELECT 
          quantile_cont(cpu_pct, 0.95) as p95_cpu,
          quantile_cont(cpu_pct, 0.99) as p99_cpu,
          quantile_cont(memory_pct, 0.95) as p95_memory,
          quantile_cont(memory_pct, 0.99) as p99_memory
        FROM metrics 
        WHERE resource_id = ?
      `, [id], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  getAnomalies: () => {
    return new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM metrics 
        WHERE is_anomaly = 'true' OR cpu_pct > 90 OR memory_pct > 90 
        ORDER BY timestamp DESC LIMIT 100
      `, (err, rows) => {
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
  },

  updateRecommendationStatus: (recId, status) => {
    return new Promise((resolve, reject) => {
      db.run(`UPDATE recommendations SET status = ? WHERE rec_id = ?`, [status, recId], function(err) {
        if (err) reject(err);
        else resolve({ updated: this.changes });
      });
    });
  },

  batchUpdateRecommendations: (recIds, status) => {
    return new Promise((resolve, reject) => {
      if (!recIds || recIds.length === 0) {
        return resolve({ updated: 0 });
      }
      const placeholders = recIds.map(() => '?').join(',');
      db.run(`UPDATE recommendations SET status = ? WHERE rec_id IN (${placeholders})`, [status, ...recIds], function(err) {
        if (err) reject(err);
        else resolve({ updated: this.changes });
      });
    });
  },

  getCostSummary: () => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT SUM(monthly_cost) as total_current_spend FROM inventory`, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },

  getCostBreakdown: () => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT environment, SUM(monthly_cost) as cost FROM inventory GROUP BY environment`, (err, envRows) => {
        if (err) return reject(err);
        db.all(`SELECT owner, SUM(monthly_cost) as cost FROM inventory GROUP BY owner`, (err2, teamRows) => {
          if (err2) return reject(err2);
          
          const by_environment = {};
          envRows.forEach(r => by_environment[r.environment] = r.cost);

          const by_department = {};
          teamRows.forEach(r => by_department[r.owner] = r.cost);

          resolve({ by_environment, by_department });
        });
      });
    });
  },

  getPotentialSavings: () => {
    return new Promise((resolve, reject) => {
      db.get(`SELECT SUM(estimated_monthly_saving) as total_savings FROM recommendations WHERE status = 'Pending'`, (err, row) => {
        if (err) reject(err);
        else resolve(row ? row.total_savings || 0 : 0);
      });
    });
  }
};