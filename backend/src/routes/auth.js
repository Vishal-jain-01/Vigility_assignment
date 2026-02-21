import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import prisma from '../lib/prisma.js'

const router = express.Router()

const isLocal = !process.env.FRONTEND_URL

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: !isLocal,
  sameSite: isLocal ? 'lax' : 'none',
  maxAge: 24 * 60 * 60 * 1000
}

const USER_COOKIE_OPTIONS = {
  httpOnly: false,
  secure: !isLocal,
  sameSite: isLocal ? 'lax' : 'none',
  maxAge: 24 * 60 * 60 * 1000
}

// POST /register
router.post('/register', async (req, res) => {
  const { username, password, age, gender } = req.body

  if (!username || !password || !age || !gender) {
    return res.status(400).json({ error: 'All fields are required' })
  }

  try {
    const existing = await prisma.user.findUnique({ where: { username } })
    if (existing) {
      return res.status(400).json({ error: 'Username already exists' })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        age: parseInt(age),
        gender
      }
    })

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    const userData = { id: user.id, username: user.username, age: user.age, gender: user.gender }

    res.cookie('auth_token', token, COOKIE_OPTIONS)
    res.cookie('user_data', JSON.stringify(userData), USER_COOKIE_OPTIONS)

    res.status(201).json({ user: userData, token })
  } catch (err) {
    console.error('Register error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /login
router.post('/login', async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' })
  }

  try {
    const user = await prisma.user.findUnique({ where: { username } })
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid credentials' })
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    const userData = { id: user.id, username: user.username, age: user.age, gender: user.gender }

    res.cookie('auth_token', token, COOKIE_OPTIONS)
    res.cookie('user_data', JSON.stringify(userData), USER_COOKIE_OPTIONS)

    res.json({ user: userData, token })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

// POST /logout
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token', { httpOnly: true, secure: !isLocal, sameSite: isLocal ? 'lax' : 'none' })
  res.clearCookie('user_data', { secure: !isLocal, sameSite: isLocal ? 'lax' : 'none' })
  res.json({ message: 'Logged out successfully' })
})

export default router
