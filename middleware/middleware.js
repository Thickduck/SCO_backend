import jwt from "jsonwebtoken"

export function authenticateToken(req, res, next) {
  const secret = process.env.JWT_SECRET

  if (!secret) {
    return res.status(503).json({ error: "Authentication is not configured" })
  }

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
