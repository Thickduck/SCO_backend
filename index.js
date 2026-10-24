import express from "express"
import cors from "cors"
import cloudRoutes from "./routes/cloudRoutes.js"

const app = express()
const port = process.env.PORT || 5001

app.use(cors())
app.use(express.json())

app.get("/", (_req, res) => {
  res.json({ status: 200 })
})

// Mount all API routes
app.use("/api", cloudRoutes)

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})