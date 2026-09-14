import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // 1. Get the test user
  const user = await prisma.user.findFirst({
    where: { email: 'test_register@test.com' }
  });

  if (!user) {
    console.error('User test_register@test.com not found!');
    return;
  }

  // 2. Get or create an account
  let account = await prisma.account.findFirst({
    where: { userId: user.id }
  });

  if (!account) {
    account = await prisma.account.create({
      data: {
        userId: user.id,
        name: 'Main Checking',
        type: 'CHECKING',
        balance: 5000,
        currency: 'USD'
      }
    });
  }

  // 3. Create or find categories
  const categoryNames = ['Food', 'Entertainment', 'Utilities'];
  const categories = [];

  for (const name of categoryNames) {
    let cat = await prisma.category.findFirst({
      where: { userId: user.id, name, type: 'EXPENSE' }
    });
    if (!cat) {
      cat = await prisma.category.create({
        data: {
          userId: user.id,
          name,
          type: 'EXPENSE'
        }
      });
    }
    categories.push(cat);
  }

  // 4. Delete existing transactions for this user to have a clean slate for predictions
  await prisma.transaction.deleteMany({
    where: { userId: user.id, type: 'EXPENSE' }
  });

  // 5. Insert historical data to simulate upward trend
  // Month 1 (June 2026): Total 300
  // Month 2 (July 2026): Total 420
  // Month 3 (August 2026): Total 510
  // Month 4 (September 2026): Partial (we can add some or leave to see trend)

  const expenses = [
    // June 2026
    { month: '2026-06', amounts: [100, 100, 100] }, // Total 300
    // July 2026
    { month: '2026-07', amounts: [150, 120, 150] }, // Total 420
    // August 2026
    { month: '2026-08', amounts: [200, 160, 150] }, // Total 510
  ];

  for (const monthData of expenses) {
    for (let i = 0; i < monthData.amounts.length; i++) {
      const amount = monthData.amounts[i];
      const category = categories[i % categories.length];
      
      await prisma.transaction.create({
        data: {
          userId: user.id,
          accountId: account.id,
          categoryId: category.id,
          type: 'EXPENSE',
          amount: amount,
          description: `Test expense for ${category.name}`,
          transactionDate: new Date(`${monthData.month}-15T12:00:00Z`),
        }
      });
    }
  }

  console.log('Seed completed successfully. Historical expenses created!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
