import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
dotenv.config()

import authRoutes from './routes/auth.js'
import trackRoutes from './routes/track.js'
import analyticsRoutes from './routes/analytics.js'

const app = express()

app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}))

app.use(express.json())
app.use(cookieParser())

// Routes
app.use('/', authRoutes)
app.use('/', trackRoutes)
app.use('/', analyticsRoutes)


const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`)
})
