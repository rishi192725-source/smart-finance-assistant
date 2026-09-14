import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { env } from '../utils/env';

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'none' : 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user, accessToken, refreshToken } = await authService.registerUser(req.body);
    setRefreshCookie(res, refreshToken);
    res.status(201).json({
      status: 'success',
      data: { user, accessToken },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.loginUser(email, password);
    setRefreshCookie(res, refreshToken);
    res.status(200).json({
      status: 'success',
      data: { user, accessToken },
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    const { accessToken, newRefreshToken } = await authService.refreshTokens(refreshToken);
    setRefreshCookie(res, newRefreshToken);
    res.status(200).json({
      status: 'success',
      data: { accessToken },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.cookie('refreshToken', 'loggedout', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'strict',
      expires: new Date(0),
    });
    res.status(200).json({ status: 'success' });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'fail', message: 'Not authenticated' });
    }
    const user = await authService.getUserById(req.user.userId);
    res.status(200).json({
      status: 'success',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};
