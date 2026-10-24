import db from '../database/connection.js';

const normalizeRow = (row) => Object.fromEntries(
  Object.entries(row).map(([key, value]) => [key, typeof value === 'bigint' ? Number(value) : value]),
);

const queryOne = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, ...params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows[0] && normalizeRow(rows[0]));
  });
});

export const CloudModel = {
  getUserByEmail: (email) => queryOne(`SELECT * FROM users WHERE email = ?`, [email]),
  getUserById: (userId) => queryOne(`SELECT * FROM users WHERE user_id = ?`, [userId]),

  createUser: (userId, email, password, name, role) => {
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO users (user_id, email, password, name, role, is_admin) VALUES (?, ?, ?, ?, ?, FALSE)`,
        userId, email, password, name, role || 'engineer',
        function(err) {
          if (err) reject(err);
          else resolve({ user_id: userId, email, name, role: role || 'engineer', is_admin: false });
        }
      );
    });
  },

  updateUserProfile: (userId, { name, email, role }) => new Promise((resolve, reject) => {
    db.all(
      `UPDATE users SET name = ?, email = ?, role = ? WHERE user_id = ?
       RETURNING user_id, email, name, role, is_admin`,
      name, email, role, userId,
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0] && normalizeRow(rows[0]));
      },
    );
  }),

  getCompanyDetails: () => queryOne(`
    SELECT name, website, industry, contact_email, address
    FROM company_settings WHERE company_id = 'default'
  `),

  updateCompanyDetails: ({ name, website, industry, contact_email, address }) => new Promise((resolve, reject) => {
    db.all(
      `UPDATE company_settings
       SET name = ?, website = ?, industry = ?, contact_email = ?, address = ?
       WHERE company_id = 'default'
       RETURNING name, website, industry, contact_email, address`,
      name, website, industry, contact_email, address,
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows[0] && normalizeRow(rows[0]));
      },
    );
  }),

  getAllInventory: () => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM inventory`, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  getResourceById: (id) => queryOne(`SELECT * FROM inventory WHERE resource_id = ?`, [id]),

  getInventoryStats: () => queryOne(`
    SELECT
      COUNT(*) as total_resources,
      SUM(monthly_cost) as total_monthly_cost,
      SUM(CASE WHEN type = 'VM' THEN 1 ELSE 0 END) as total_vms,
      SUM(CASE WHEN type = 'block-volume' THEN 1 ELSE 0 END) as total_volumes,
      SUM(CASE WHEN type = 'public-ip' THEN 1 ELSE 0 END) as total_ips
    FROM inventory
  `),

  getMetricsForResource: (id) => {
    return new Promise((resolve, reject) => {
      db.all(`SELECT * FROM metrics WHERE resource_id = ? ORDER BY timestamp DESC LIMIT 50`, id, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  },

  getResourcePercentiles: (id) => queryOne(`
    SELECT
      quantile_cont(cpu_pct, 0.95) as p95_cpu,
      quantile_cont(cpu_pct, 0.99) as p99_cpu,
      quantile_cont(memory_pct, 0.95) as p95_memory,
      quantile_cont(memory_pct, 0.99) as p99_memory
    FROM metrics
    WHERE resource_id = ?
  `, [id]),

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

  getRecommendationSavings: (recIds) => {
    if (!recIds || recIds.length === 0) return Promise.resolve(0);
    const placeholders = recIds.map(() => '?').join(',');
    return queryOne(
      `SELECT COALESCE(SUM(estimated_monthly_saving), 0) as total_savings
       FROM recommendations
       WHERE status = 'Pending' AND rec_id IN (${placeholders})`,
      recIds,
    ).then((row) => row.total_savings);
  },

  updateRecommendationStatus: (recId, status) => {
    return new Promise((resolve, reject) => {
      db.all(`UPDATE recommendations SET status = ? WHERE rec_id = ? RETURNING rec_id`, status, recId, (err, rows) => {
        if (err) reject(err);
        else resolve({ updated: rows.length });
      });
    });
  },

  batchUpdateRecommendations: (recIds, status) => {
    return new Promise((resolve, reject) => {
      if (!recIds || recIds.length === 0) {
        return resolve({ updated: 0 });
      }
      const placeholders = recIds.map(() => '?').join(',');
      db.all(`UPDATE recommendations SET status = ? WHERE rec_id IN (${placeholders}) RETURNING rec_id`, status, ...recIds, (err, rows) => {
        if (err) reject(err);
        else resolve({ updated: rows.length });
      });
    });
  },

  getCostSummary: () => queryOne(`SELECT SUM(monthly_cost) as total_current_spend FROM inventory`),

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

  getPotentialSavings: async () => {
    const row = await queryOne(`SELECT SUM(estimated_monthly_saving) as total_savings FROM recommendations WHERE status = 'Pending'`);
    return row ? row.total_savings || 0 : 0;
  }
};