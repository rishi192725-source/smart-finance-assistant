const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
  const user = await prisma.user.findFirst({ where: { email: 'test_register@test.com' } });
  
  const txs = await prisma.transaction.findMany({
    where: { userId: user.id, type: 'EXPENSE' },
    select: { amount: true, transactionDate: true },
    orderBy: { transactionDate: 'asc' }
  });

  const historical_monthly_totals = [];
  if (txs.length > 0) {
    const monthlyTotals = {};
    let minMonth = '';
    let maxMonth = '';
    for (const t of txs) {
      const month = t.transactionDate.toISOString().substring(0, 7);
      if (!minMonth) minMonth = month;
      maxMonth = month;
      monthlyTotals[month] = (monthlyTotals[month] || 0) + Number(t.amount);
    }
    
    console.log("Monthly totals map:", monthlyTotals);

    const start = new Date(`${minMonth}-01T00:00:00Z`);
    const end = new Date(`${maxMonth}-01T00:00:00Z`);
    let current = new Date(start);
    while (current <= end) {
      const month = current.toISOString().substring(0, 7);
      historical_monthly_totals.push(monthlyTotals[month] || 0);
      current.setUTCMonth(current.getUTCMonth() + 1);
    }
  }

  console.log("historical_monthly_totals sent to ML:", historical_monthly_totals);
}

debug().catch(console.error).finally(() => prisma.$disconnect());
