import express from 'express'
import prisma from '../lib/prisma.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()

router.post('/track', authMiddleware, async (req, res) => {
  const { feature_name } = req.body

  if (!feature_name) {
    return res.status(400).json({ error: 'feature_name is required' })
  }

  try {
    const click = await prisma.featureClick.create({
      data: {
        userId: req.user.userId,
        featureName: feature_name,
        timestamp: new Date()
      }
    })

    res.status(201).json(click)
  } catch (err) {
    console.error('Track error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
