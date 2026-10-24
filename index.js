import express from "express"
import cors from "cors"
import cloudRoutes from "./routes/cloudRoutes.js"
import db, { initializeDatabase } from "./database/connection.js"

const app = express()
const port = process.env.PORT || 5001

app.use(cors())
app.use(express.json())

app.get("/", (_req, res) => {
  res.json({ status: 200 })
})

// Mount all API routes
app.use("/api", cloudRoutes)

initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`)
    })
  })
  .catch((error) => {
    console.error("Database initialization failed:", error)
    db.close()
    process.exitCode = 1
  })