import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { BaseError } from '../../../domain/errors';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof BaseError) {
    return res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
    });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'InvalidParameters',
      message: err.issues.map(e => e.message).join(', '),
    });
  }

  // Loggear el error para depuración, idealmente con un logger como Pino
  console.error(err);

  return res.status(500).json({
    error: 'InternalServerError',
    message: 'An unexpected error occurred.',
  });
};
