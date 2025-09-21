export interface IDateCalculatorParams {
  startDate: Date;
  days?: number;
  hours?: number;
}

export interface IDateCalculator {
  calculateBusinessDate(params: IDateCalculatorParams): Promise<Date>;
}
