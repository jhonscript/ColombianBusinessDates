import { Request, Response, NextFunction } from 'express';
import { IDateCalculator } from '../../domain/ports/IDateCalculator';
import { calculationSchema } from './dateCalculator.schema';

export class DateCalculatorController {
  constructor(private dateCalculatorService: IDateCalculator) {}

  public calculate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const queryParams = calculationSchema.parse(req.query);

      const startDate = queryParams.date ? new Date(queryParams.date) : new Date();

      const result = await this.dateCalculatorService.calculateBusinessDate({
        startDate,
        days: queryParams.days,
        hours: queryParams.hours,
      });

      res.status(200).json({ date: result.toISOString() });
    } catch (error) {
      next(error);
    }
  };
}
