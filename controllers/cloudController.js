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

export const getResourceMetrics = async (req, res) => {
  try {
    const metrics = await CloudModel.getMetricsForResource(req.params.id);
    res.json(metrics);
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