const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const users = await prisma.user.findMany({ include: { accounts: true } });
  for (const u of users) {
    if (u.accounts.length === 0) {
      await prisma.account.create({
        data: { userId: u.id, name: 'Main Checking', type: 'CHECKING', balance: 0, currency: 'USD' }
      });
      console.log('Created account for', u.email);
    }
  }
}
run().catch(console.error).finally(() => prisma.$disconnect());
