import express from "express"
import * as controller from "../controllers/cloudController.js"

const router = express.Router()

router.get("/inventory", controller.getInventory)
router.get("/metrics/:id", controller.getResourceMetrics)
router.get("/recommendations", controller.getRecommendations)

export default router