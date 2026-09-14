import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middlewares/errorHandler';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { exclude } from '../utils/exclude';

export const prisma = new PrismaClient();

export const authService = {
  async registerUser(data: any) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new AppError('Email already in use', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        categories: {
          create: [
            { name: 'Food', type: 'EXPENSE' },
            { name: 'Transport', type: 'EXPENSE' },
            { name: 'Shopping', type: 'EXPENSE' },
            { name: 'Bills', type: 'EXPENSE' },
            { name: 'Entertainment', type: 'EXPENSE' },
            { name: 'Education', type: 'EXPENSE' },
            { name: 'Healthcare', type: 'EXPENSE' },
            { name: 'Other', type: 'EXPENSE' },
            { name: 'Salary', type: 'INCOME' },
            { name: 'Freelance', type: 'INCOME' },
            { name: 'Scholarship', type: 'INCOME' },
            { name: 'Other', type: 'INCOME' },
          ],
        },
        accounts: {
          create: [
            { name: 'Main Checking', type: 'CHECKING', balance: 0, currency: 'USD' }
          ]
        },
      },
    });

    const accessToken = signAccessToken({ userId: user.id });
    const refreshToken = signRefreshToken({ userId: user.id });

    return {
      user: exclude(user, ['passwordHash']),
      accessToken,
      refreshToken,
    };
  },

  async loginUser(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      throw new AppError('Invalid email or password', 401);
    }

    const accessToken = signAccessToken({ userId: user.id });
    const refreshToken = signRefreshToken({ userId: user.id });

    return {
      user: exclude(user, ['passwordHash']),
      accessToken,
      refreshToken,
    };
  },

  async refreshTokens(refreshToken: string | undefined) {
    if (!refreshToken) {
      throw new AppError('Refresh token missing', 401);
    }

    try {
      const decoded = verifyRefreshToken(refreshToken);
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      
      if (!user) {
        throw new AppError('User no longer exists', 401);
      }

      const newAccessToken = signAccessToken({ userId: user.id });
      const newRefreshToken = signRefreshToken({ userId: user.id });

      return { accessToken: newAccessToken, newRefreshToken };
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  },

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError('User not found', 404);
    }
    return exclude(user, ['passwordHash']);
  }
};
