import express from 'express';
import helmet from 'helmet';
import { HolidayApiProvider } from '../infrastructure/services/HolidayApiProvider';
import { DateCalculatorService } from '../infrastructure/services/DateCalculator.service';
import { DateCalculatorController } from '../../features/business-date-calculator/dateCalculator.controller';
import { registerDateCalculatorRoutes } from './routes/dateCalculator.routes';
import { errorHandler } from './middlewares/errorHandler';

// --- Composition Root ---
const holidayProvider = new HolidayApiProvider();
const dateCalculatorService = new DateCalculatorService(holidayProvider);
const dateCalculatorController = new DateCalculatorController(dateCalculatorService);

// --- Express App Setup ---
const app = express();

// Middlewares de seguridad y utilidad
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de la aplicación
const apiRouter = express.Router();
registerDateCalculatorRoutes(apiRouter, dateCalculatorController);
app.use('/', apiRouter);

// Middleware de manejo de errores (debe ser el último)
app.use(errorHandler);

// --- Server Initialization (for local development only) ---
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default app; // Exportar para pruebas de integración y para el handler de Lambda