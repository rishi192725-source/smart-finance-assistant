import { Request, Response, NextFunction } from 'express';
import { env } from '../utils/env';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let { statusCode, message } = err;
  
  if (!(err instanceof AppError)) {
    statusCode = 500;
    message = 'Internal Server Error';
    console.error('💥 ERROR:', err);
  }

  res.status(statusCode || 500).json({
    status: 'error',
    message,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};
