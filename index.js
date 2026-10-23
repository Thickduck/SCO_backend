import express from "express"
import cors from "cors"
import jwt from "jsonwebtoken"
import { authenticateToken } from "../middleware/middleware.js"

const app = express()
const port = process.env.PORT || 5001

app.use(cors())
app.use(express.json())

app.get("/", (_req, res) => {
  res.json({ status: 200 })
})

app.post("/api/auth/login", (req, res) => {
  const { email, password } = req.body ?? {}
  const { TEST_USER_EMAIL, TEST_USER_PASSWORD, JWT_SECRET } = process.env

  if (!TEST_USER_EMAIL || !TEST_USER_PASSWORD || !JWT_SECRET) {
    return res.status(503).json({ error: "Login is not configured" })
  }

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required" })
  }

  if (email !== TEST_USER_EMAIL || password !== TEST_USER_PASSWORD) {
    return res.status(401).json({ error: "Email or password is incorrect" })
  }

  const token = jwt.sign({ sub: email }, JWT_SECRET, { expiresIn: "1h" })
  return res.json({ token })
})

app.get("/api/auth/me", authenticateToken, (req, res) => {
  return res.json({ user: { email: req.user.sub } })
})

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})