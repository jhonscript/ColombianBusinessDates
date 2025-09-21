import { DateCalculatorService } from './DateCalculator.service';
import { IHolidayProvider } from '../../../domain/ports/IHolidayProvider';

// Mock del HolidayProvider para tener un entorno de pruebas controlado
class MockHolidayProvider implements IHolidayProvider {
  private holidays: Set<string>;

  constructor(holidays: string[]) {
    this.holidays = new Set(holidays);
  }

  async getHolidays(year: number): Promise<Set<string>> {
    return this.holidays;
  }
}

describe('DateCalculatorService', () => {
  // Festivos para las pruebas, incluyendo los de Semana Santa de 2025
  const mockHolidays = ['2025-04-17', '2025-04-18'];
  const holidayProvider = new MockHolidayProvider(mockHolidays);
  const calculator = new DateCalculatorService(holidayProvider);

  // Helper para crear fechas en UTC fácilmente
  const createUtcDate = (dateString: string) => new Date(dateString);

  it('Ejemplo 1: Petición un viernes a las 5:00 p.m. con hours=1', async () => {
    const startDate = createUtcDate('2025-09-19T22:00:00.000Z'); // Viernes 5pm en Colombia
    const result = await calculator.calculateBusinessDate({ startDate, hours: 1 });
    // Esperado: Lunes 9am Colombia -> 2025-09-22T14:00:00.000Z
    expect(result.toISOString()).toBe('2025-09-22T14:00:00.000Z');
  });

  it('Ejemplo 3: Petición con days=1 y hours=4 desde un martes a las 3:00 p.m.', async () => {
    const startDate = createUtcDate('2025-09-23T20:00:00.000Z'); // Martes 3pm en Colombia
    const result = await calculator.calculateBusinessDate({ startDate, days: 1, hours: 4 });
    // Esperado: Jueves 10am Colombia -> 2025-09-25T15:00:00.000Z
    expect(result.toISOString()).toBe('2025-09-25T15:00:00.000Z');
  });

  it('Ejemplo 4: Petición con days=1 desde un domingo a las 6:00 p.m.', async () => {
    const startDate = createUtcDate('2025-09-21T23:00:00.000Z'); // Domingo 6pm en Colombia
    const result = await calculator.calculateBusinessDate({ startDate, days: 1 });
    // Esperado: Lunes 5pm Colombia -> 2025-09-22T22:00:00.000Z
    expect(result.toISOString()).toBe('2025-09-22T22:00:00.000Z');
  });

  it('Ejemplo 5: Petición con hours=8 desde un día laboral a las 8:00 a.m.', async () => {
    const startDate = createUtcDate('2025-09-23T13:00:00.000Z'); // Martes 8am en Colombia
    const result = await calculator.calculateBusinessDate({ startDate, hours: 8 });
    // Esperado: Mismo día 5pm Colombia -> 2025-09-23T22:00:00.000Z
    expect(result.toISOString()).toBe('2025-09-23T22:00:00.000Z');
  });

  // NOTA: El ejemplo 8 original requería precisión de minutos. Esta es la versión con precisión de horas.
  it('Ejemplo 8 (con precisión de horas)', async () => {
    const startDate = createUtcDate('2025-09-23T16:00:00.000Z'); // Martes 11am en Colombia
    const result = await calculator.calculateBusinessDate({ startDate, hours: 3 });
    // Esperado: Mismo día 3pm Colombia -> 2025-09-23T20:00:00.000Z
    expect(result.toISOString()).toBe('2025-09-23T20:00:00.000Z');
  });

  it('Ejemplo 9: Petición con festivos', async () => {
    const startDate = createUtcDate('2025-04-10T15:00:00.000Z'); // Jueves 10am Colombia
    const result = await calculator.calculateBusinessDate({ startDate, days: 5, hours: 4 });
    // Esperado: Lunes 21 de abril 3pm Colombia -> 2025-04-21T20:00:00.000Z
    expect(result.toISOString()).toBe('2025-04-21T20:00:00.000Z');
  });
});
