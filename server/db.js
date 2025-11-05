import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  
}
async function queryWithPool() {
  try {
  await prisma.$disconnect()
  } catch (err) {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  } finally {
    
  }
}

main().then(()=>queryWithPool())