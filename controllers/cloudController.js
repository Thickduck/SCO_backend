import jwt from 'jsonwebtoken';
import { CloudModel } from '../models/cloudModel.js';

export const register = async (req, res) => {
  try {
    const { email, password, name, role } = req.body ?? {};
    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }

    const existingUser = await CloudModel.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: "User with this email already exists" });
    }

    const userId = `usr-${Date.now()}`;
    const newUser = await CloudModel.createUser(userId, email, password, name, role);

    const secret = process.env.JWT_SECRET || "fallback_secret";
    const token = jwt.sign(
      { 
        sub: newUser.email, 
        userId: newUser.user_id, 
        role: newUser.role, 
        name: newUser.name 
      },
      secret,
      { expiresIn: "8h" }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.user_id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body ?? {};
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await CloudModel.getUserByEmail(email);
    if (!user || user.password !== password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const secret = process.env.JWT_SECRET || "fallback_secret";
    const token = jwt.sign(
      { 
        sub: user.email, 
        userId: user.user_id, 
        role: user.role, 
        name: user.name 
      },
      secret,
      { expiresIn: "8h" }
    );

    res.json({
      token,
      user: {
        id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await CloudModel.getUserByEmail(req.user.sub);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({
      user: {
        id: user.user_id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getInventory = async (req, res) => {
  try {
    const data = await CloudModel.getAllInventory();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getInventoryStats = async (req, res) => {
  try {
    const stats = await CloudModel.getInventoryStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getResourceById = async (req, res) => {
  try {
    const resource = await CloudModel.getResourceById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: "Resource not found" });
    }
    res.json(resource);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getResourceMetrics = async (req, res) => {
  try {
    const metrics = await CloudModel.getMetricsForResource(req.params.id);
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getResourcePercentiles = async (req, res) => {
  try {
    const percentiles = await CloudModel.getResourcePercentiles(req.params.id);
    res.json(percentiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAnomalies = async (req, res) => {
  try {
    const anomalies = await CloudModel.getAnomalies();
    res.json(anomalies);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getRecommendations = async (req, res) => {
  try {
    const recs = await CloudModel.getAllRecommendations();
    res.json(recs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateRecommendationAction = async (req, res) => {
  try {
    const { status } = req.body;
    const result = await CloudModel.updateRecommendationStatus(req.params.id, status || 'Applied');
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const applyRecommendation = async (req, res) => {
  try {
    const result = await CloudModel.updateRecommendationStatus(req.params.id, 'Applied');
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const dismissRecommendation = async (req, res) => {
  try {
    const result = await CloudModel.updateRecommendationStatus(req.params.id, 'Dismissed');
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const batchApplyRecommendations = async (req, res) => {
  try {
    const { rec_ids } = req.body;
    const result = await CloudModel.batchUpdateRecommendations(rec_ids, 'Applied');
    const savings = await CloudModel.getPotentialSavings();
    res.json({ success: true, applied_count: result.updated, total_estimated_savings: savings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCostSummary = async (req, res) => {
  try {
    const summary = await CloudModel.getCostSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCostBreakdown = async (req, res) => {
  try {
    const breakdown = await CloudModel.getCostBreakdown();
    res.json(breakdown);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCostForecast = async (req, res) => {
  try {
    const summary = await CloudModel.getCostSummary();
    const current = summary ? summary.total_current_spend || 245000 : 245000;
    res.json({
      current_monthly_spend: current,
      forecast_30_days: Math.round(current * 1.03),
      forecast_60_days: Math.round(current * 1.06),
      forecast_90_days: Math.round(current * 1.10)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCostBeforeVsAfter = async (req, res) => {
  try {
    const summary = await CloudModel.getCostSummary();
    const current = summary ? summary.total_current_spend || 245000 : 245000;
    const savings = await CloudModel.getPotentialSavings();
    res.json({
      current_monthly_spend: current,
      optimized_monthly_spend: Math.max(0, current - savings),
      projected_monthly_savings: savings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAlerts = async (req, res) => {
  try {
    const anomalies = await CloudModel.getAnomalies();
    const alerts = anomalies.map((a, i) => ({
      alert_id: `alt-${i + 1}`,
      severity: a.cpu_pct > 95 ? 'High' : 'Medium',
      message: `Resource ${a.resource_id} exhibited high CPU/memory utilization (${a.cpu_pct}% CPU).`,
      timestamp: a.timestamp
    }));
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getForecast = async (req, res) => {
  try {
    res.json({
      trend: "increasing",
      projected_growth_rate_pct: 3.5,
      recommendation: "Review auto-scaling policies for dev clusters and terminate orphaned storage volumes."
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const runSimulatorWhatIf = async (req, res) => {
  try {
    const { shutdownDevAtNight, rightsizeUnderutilized } = req.body;
    let simulatedSavings = 0;
    if (shutdownDevAtNight) simulatedSavings += 1450;
    if (rightsizeUnderutilized) simulatedSavings += 2300;

    res.json({
      simulatedMonthlySavings: simulatedSavings,
      message: "Simulation completed successfully based on active parameters."
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const explainAI = async (req, res) => {
  try {
    const { resource_id, metrics_summary } = req.body;
    res.json({
      explanation: `AI Cost Analysis for ${resource_id || 'Target Resource'}: Based on metrics (${metrics_summary || 'low utilization'}), this asset is over-provisioned and can be safely rightsized or terminated to reduce monthly burn rate.`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const exportData = async (req, res) => {
  try {
    const format = req.params.format;
    if (format === 'terraform') {
      res.json({
        format: 'terraform',
        content: 'resource "aws_instance" "optimized_vm" { ami = "ami-0c55b159cbfafe1f0" instance_type = "t3.small" }'
      });
    } else if (format === 'csv') {
      res.json({
        format: 'csv',
        content: 'resource_id,name,type,monthly_cost\nvm-cluster-1001,instance-1-prod,VM,3820.0'
      });
    } else {
      res.json({
        format: format || 'json',
        content: '# Automated remediation script\naws ec2 modify-instance-attribute --instance-id vm-cluster-1001 --instance-type t3.small'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSustainability = async (req, res) => {
  try {
    res.json({
      carbon_saved_kg_co2e_per_month: 412.5,
      equivalent_trees_planted: 19,
      energy_saved_kwh: 950.0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};