import { PrismaClient } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';

const prisma = new PrismaClient();

function mapGoal(goal: any) {
  const target = Number(goal.targetAmount);
  const current = Number(goal.currentAmount);
  
  let progressPercentage = 0;
  if (target > 0) {
    progressPercentage = (current / target) * 100;
  }
  
  return {
    ...goal,
    targetAmount: target,
    currentAmount: current,
    progressPercentage: Math.min(100, progressPercentage),
    rawProgressPercentage: progressPercentage,
    remainingAmount: Math.max(0, target - current),
    isCompleted: current >= target
  };
}

export const goalService = {
  async createGoal(userId: string, name: string, targetAmount: number, currentAmount: number = 0, deadline: Date | undefined) {
    const goal = await prisma.goal.create({
      data: { userId, name, targetAmount, currentAmount, deadline },
    });
    return mapGoal(goal);
  },

  async getGoals(userId: string) {
    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return goals.map(mapGoal);
  },

  async getGoalById(userId: string, goalId: string) {
    const goal = await prisma.goal.findFirst({
      where: { id: goalId, userId },
    });
    if (!goal) {
      throw new AppError('Goal not found', 404);
    }
    return mapGoal(goal);
  },

  async updateGoal(userId: string, goalId: string, data: { name?: string; targetAmount?: number; currentAmount?: number; deadline?: Date }) {
    await this.getGoalById(userId, goalId); // Checks ownership

    const goal = await prisma.goal.update({
      where: { id: goalId },
      data,
    });
    return mapGoal(goal);
  },

  async deleteGoal(userId: string, goalId: string) {
    await this.getGoalById(userId, goalId);

    await prisma.goal.delete({
      where: { id: goalId },
    });
    return { success: true };
  },

  async addContribution(userId: string, goalId: string, amount: number) {
    // 1. Verify existence and ownership
    await this.getGoalById(userId, goalId);

    // 2. Atomic increment
    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        currentAmount: {
          increment: amount,
        },
      },
    });
    
    return mapGoal(updatedGoal);
  },
};
