import { Router } from 'express';
import { DateCalculatorController } from '../../../features/business-date-calculator/dateCalculator.controller';

// Esta función conectará el controlador a la instancia del router
export const registerDateCalculatorRoutes = (router: Router, controller: DateCalculatorController): void => {
  router.get('/calculate', controller.calculate);
};
