import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
dotenv.config()

const prisma = new PrismaClient()

const FEATURES = [
  'date_filter',
  'gender_filter',
  'age_filter',
  'bar_chart_zoom',
  'line_chart_hover',
  'export_data',
  'refresh_data'
]

const GENDERS = ['Male', 'Female', 'Other']

const USERS = [
  { username: 'user1',  age: 16,  gender: 'Male'   },
  { username: 'user2',  age: 25,  gender: 'Female' },
  { username: 'user3',  age: 32,  gender: 'Male'   },
  { username: 'user4',  age: 45,  gender: 'Female' },
  { username: 'user5',  age: 55,  gender: 'Other'  },
  { username: 'user6',  age: 17,  gender: 'Female' },
  { username: 'user7',  age: 28,  gender: 'Male'   },
  { username: 'user8',  age: 38,  gender: 'Female' },
  { username: 'user9',  age: 50,  gender: 'Male'   },
  { username: 'user10', age: 22,  gender: 'Other'  }
]

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()))
}

async function seed() {
  console.log('Starting database seed...\n')


  await prisma.featureClick.deleteMany()
  await prisma.user.deleteMany()
  console.log('Cleared existing data')


  const hashedPassword = await bcrypt.hash('password123', 10)
  const users = []

  for (const template of USERS) {
    const user = await prisma.user.create({
      data: { ...template, password: hashedPassword }
    })
    users.push(user)
  }
  console.log(`Created ${users.length} users`)


  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 90)

  const clicks = []
  for (let i = 0; i < 100; i++) {
    clicks.push({
      userId: users[randomInt(0, users.length - 1)].id,
      featureName: FEATURES[randomInt(0, FEATURES.length - 1)],
      timestamp: randomDate(startDate, endDate)
    })
  }

  await prisma.featureClick.createMany({ data: clicks })
  console.log('Created 100 feature clicks across the last 90 days\n')

  console.log('Seeding complete!')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('Test credentials (all users share password: password123)')
  USERS.forEach(u => console.log(`   ${u.username.padEnd(8)} | age: ${u.age} | gender: ${u.gender}`))
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
}

seed()
  .catch(e => {
    console.error('Seed failed:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
