import express from 'express'
import prisma from '../lib/prisma.js'
import authMiddleware from '../middleware/auth.js'

const router = express.Router()


router.get('/analytics', authMiddleware, async (req, res) => {
  const { startDate, endDate, ageGroup, gender, feature } = req.query

  try {

    const userWhere = {}

    if (gender && gender !== 'All') {
      userWhere.gender = gender
    }

    if (ageGroup && ageGroup !== 'All') {
      if (ageGroup === '<18') {
        userWhere.age = { lt: 18 }
      } else if (ageGroup === '18-40') {
        userWhere.age = { gte: 18, lte: 40 }
      } else if (ageGroup === '>40') {
        userWhere.age = { gt: 40 }
      }
    }

    const timestampFilter = {}
    if (startDate) {
      timestampFilter.gte = new Date(startDate + 'T00:00:00.000Z')
    }
    if (endDate) {
      timestampFilter.lte = new Date(endDate + 'T23:59:59.999Z')
    }

    const clickWhere = {}
    if (Object.keys(timestampFilter).length > 0) {
      clickWhere.timestamp = timestampFilter
    }
    if (Object.keys(userWhere).length > 0) {
      clickWhere.user = userWhere
    }

    const clicks = await prisma.featureClick.findMany({
      where: clickWhere,
      select: {
        featureName: true,
        timestamp: true
      },
      orderBy: { timestamp: 'asc' }
    })


    const featureCounts = {}
    clicks.forEach(click => {
      featureCounts[click.featureName] = (featureCounts[click.featureName] || 0) + 1
    })

    const barChartData = Object.entries(featureCounts)
      .map(([name, count]) => ({ feature: name, count }))
      .sort((a, b) => b.count - a.count)


    let lineChartData = []
    if (feature && feature !== 'All') {
      const featureClicks = clicks.filter(c => c.featureName === feature)
      const dailyCounts = {}

      featureClicks.forEach(click => {
        const date = click.timestamp.toISOString().split('T')[0]
        dailyCounts[date] = (dailyCounts[date] || 0) + 1
      })

      lineChartData = Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
    }

    res.json({ barChartData, lineChartData })
  } catch (err) {
    console.error('Analytics error:', err)
    res.status(500).json({ error: 'Server error' })
  }
})

export default router
