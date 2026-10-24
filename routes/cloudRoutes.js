import express from "express"
import * as controller from "../controllers/cloudController.js"
import { authenticateToken } from "../middleware/middleware.js"

const router = express.Router()

// Auth Routes
router.post("/auth/register", controller.register)
router.post("/auth/login", controller.login)
router.get("/auth/me", authenticateToken, controller.getMe)

// Core Resource & Analytics Routes (Protected)
router.get("/inventory", authenticateToken, controller.getInventory)
router.get("/metrics/:id", authenticateToken, controller.getResourceMetrics)
router.get("/recommendations", authenticateToken, controller.getRecommendations)

export default router