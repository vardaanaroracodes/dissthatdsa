// Setup script to create the initial superadmin account
// Run this after setting up the database: npx tsx scripts/setup-superadmin.ts

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as readline from 'readline'

const prisma = new PrismaClient()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve)
  })
}

async function main() {
  console.log('=== Superadmin Setup ===\n')

  // Get superadmin details from user
  const name = await question('Enter superadmin name: ')
  const email = await question('Enter superadmin email: ')
  const password = await question('Enter superadmin password (min 6 characters): ')

  if (!name || !email || !password) {
    console.error('Error: All fields are required')
    process.exit(1)
  }

  if (password.length < 6) {
    console.error('Error: Password must be at least 6 characters')
    process.exit(1)
  }

  // Check if superadmin already exists
  const existing = await prisma.admin.findUnique({
    where: { email },
  })

  if (existing) {
    console.error(`Error: Admin with email ${email} already exists`)
    process.exit(1)
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10)

  // Create superadmin
  const superadmin = await prisma.admin.create({
    data: {
      name,
      email,
      passwordHash,
      role: 'SUPERADMIN',
      isApproved: true, // Superadmin is auto-approved
    },
  })

  console.log('\n✅ Superadmin created successfully!')
  console.log(`Name: ${superadmin.name}`)
  console.log(`Email: ${superadmin.email}`)
  console.log(`Role: ${superadmin.role}`)
  console.log('\nYou can now login at /admin/login')
}

main()
  .catch((error) => {
    console.error('Error creating superadmin:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    rl.close()
  })
