import jwt from "jsonwebtoken"
import { CloudModel } from "../models/cloudModel.js"

export function authenticateToken(req, res, next) {
  const secret = process.env.JWT_SECRET || "fallback_secret"

  const authorization = req.headers.authorization
  const [scheme, token] = authorization?.split(" ") ?? []

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "A bearer token is required" })
  }

  try {
    req.user = jwt.verify(token, secret)
    return next()
  } catch {
    return res.status(401).json({ error: "Token is invalid or expired" })
  }
}

export async function requireAdmin(req, res, next) {
  try {
    const user = req.user?.userId
      ? await CloudModel.getUserById(req.user.userId)
      : await CloudModel.getUserByEmail(req.user?.sub)
    if (!user) {
      return res.status(401).json({ error: "User account was not found" })
    }
    if (user.is_admin !== true) {
      return res.status(403).json({ error: "Administrator access is required" })
    }
    return next()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return res.status(500).json({ error: message })
  }
}
