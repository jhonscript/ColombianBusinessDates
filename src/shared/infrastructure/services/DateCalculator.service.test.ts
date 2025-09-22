import { DateCalculatorService } from './DateCalculator.service';
import { IHolidayProvider } from '../../../domain/ports/IHolidayProvider';

// Mock del HolidayProvider para tener un entorno de pruebas controlado
class MockHolidayProvider implements IHolidayProvider {
  private holidays: Set<string>;

  constructor(holidays: string[]) {
    this.holidays = new Set(holidays);
  }

  async getHolidays(year: number): Promise<Set<string>> {
    // En una implementación real, podríamos devolver festivos diferentes según el año
    return this.holidays;
  }
}

describe('DateCalculatorService', () => {
  // Festivos para las pruebas, incluyendo los de Semana Santa de 2025
  const mockHolidays = ['2025-01-01', '2025-04-17', '2025-04-18', '2025-05-01'];
  const holidayProvider = new MockHolidayProvider(mockHolidays);
  const calculator = new DateCalculatorService(holidayProvider);

  // Helper para crear fechas en UTC fácilmente
  const createUtcDate = (dateString: string) => new Date(dateString);

  it('Ejemplo 1: Petición un viernes a las 5:00 p.m. con hours=1', async () => {
    const startDate = createUtcDate('2025-09-19T22:00:00.000Z'); // Viernes 5pm CO
    const result = await calculator.calculateBusinessDate({ startDate, hours: 1 });
    // Esperado: Lunes 9am CO -> 2025-09-22T14:00:00.000Z
    expect(result.toISOString()).toBe('2025-09-22T14:00:00.000Z');
  });

  it('Ejemplo 2: Petición un sábado a las 2:00 p.m. con hours=1', async () => {
    const startDate = createUtcDate('2025-09-20T19:00:00.000Z'); // Sábado 2pm CO
    const result = await calculator.calculateBusinessDate({ startDate, hours: 1 });
    // Ajusta hacia atrás a Viernes 5pm, luego suma 1h -> Lunes 9am CO
    // Esperado: Lunes 9am CO -> 2025-09-22T14:00:00.000Z
    expect(result.toISOString()).toBe('2025-09-22T14:00:00.000Z');
  });

  it('Ejemplo 3: Petición con days=1 y hours=4 desde un martes a las 3:00 p.m.', async () => {
    const startDate = createUtcDate('2025-09-23T20:00:00.000Z'); // Martes 3pm CO
    const result = await calculator.calculateBusinessDate({ startDate, days: 1, hours: 4 });
    // Suma 1 día -> Miércoles 3pm. Luego suma 4h -> Jueves 10am CO
    // Esperado: Jueves 10am CO -> 2025-09-25T15:00:00.000Z
    expect(result.toISOString()).toBe('2025-09-25T15:00:00.000Z');
  });

  it('Ejemplo 4: Petición con days=1 desde un domingo a las 6:00 p.m.', async () => {
    const startDate = createUtcDate('2025-09-21T23:00:00.000Z'); // Domingo 6pm CO
    const result = await calculator.calculateBusinessDate({ startDate, days: 1 });
    // Ajusta hacia atrás a Viernes 5pm, luego suma 1 día -> Lunes 5pm CO
    // Esperado: Lunes 5pm CO -> 2025-09-22T22:00:00.000Z
    expect(result.toISOString()).toBe('2025-09-22T22:00:00.000Z');
  });

  it('Ejemplo 5: Petición con hours=8 desde un día laboral a las 8:00 a.m.', async () => {
    const startDate = createUtcDate('2025-09-23T13:00:00.000Z'); // Martes 8am CO
    const result = await calculator.calculateBusinessDate({ startDate, hours: 8 });
    // Esperado: Mismo día 5pm CO -> 2025-09-23T22:00:00.000Z
    expect(result.toISOString()).toBe('2025-09-23T22:00:00.000Z');
  });

  it('Ejemplo 6: Petición con days=1 desde un día laboral a las 8:00 a.m.', async () => {
    const startDate = createUtcDate('2025-09-23T13:00:00.000Z'); // Martes 8am CO
    const result = await calculator.calculateBusinessDate({ startDate, days: 1 });
    // Esperado: Siguiente día laboral 8am CO -> Miércoles 8am CO
    expect(result.toISOString()).toBe('2025-09-24T13:00:00.000Z');
  });

  it('Ejemplo 7: Petición con days=1 desde un día laboral a las 12:30 p.m.', async () => {
    const startDate = createUtcDate('2025-09-23T17:30:00.000Z'); // Martes 12:30pm CO
    const result = await calculator.calculateBusinessDate({ startDate, days: 1 });
    // Ajusta hacia atrás a las 12:00pm, luego suma 1 día -> Miércoles 12:00pm CO
    // Esperado: Miércoles 12pm CO -> 2025-09-24T17:00:00.000Z
    expect(result.toISOString()).toBe('2025-09-24T17:00:00.000Z');
  });

  it('Ejemplo 8: Petición con hours=3 desde un día laboral a las 11:30 a.m.', async () => {
    const startDate = createUtcDate('2025-09-23T16:30:00.000Z'); // Martes 11:30am CO
    const result = await calculator.calculateBusinessDate({ startDate, hours: 3 });
    // 30min a las 12, salta almuerzo, 2.5h más -> 3:30pm CO
    // Esperado: Mismo día 3:30pm CO -> 2025-09-23T20:30:00.000Z
    expect(result.toISOString()).toBe('2025-09-23T20:30:00.000Z');
  });

  it('Ejemplo 9: Petición con festivos', async () => {
    const startDate = createUtcDate('2025-04-10T15:00:00.000Z'); // Jueves 10am CO
    const result = await calculator.calculateBusinessDate({ startDate, days: 5, hours: 4 });
    // Jue 10/Abr + 5d hábiles (saltando Vie 11, Lun 14, Mar 15, Mie 16, Vie 18 por ser festivo) -> Jue 24/Abr 10am
    // Luego + 4h -> Vie 25/Abr 10am CO
    // CORRECCIÓN: El cálculo original del plan era complejo. Vamos a recalcular.
    // Jue 10 (10am) + 1d -> Vie 11 (10am)
    // Vie 11 (10am) + 1d -> Lun 14 (10am)
    // Lun 14 (10am) + 1d -> Mar 15 (10am)
    // Mar 15 (10am) + 1d -> Mie 16 (10am)
    // Mie 16 (10am) + 1d -> Jue 17 (FESTIVO) -> Vie 18 (FESTIVO) -> Lun 21 (10am)
    // Fecha intermedia: Lun 21/Abr 10am. Ahora sumamos 4h.
    // 10am + 2h -> 12pm. Salta almuerzo. 1pm + 2h -> 3pm.
    // Esperado: Lunes 21 de abril 3pm Colombia -> 2025-04-21T20:00:00.000Z
    expect(result.toISOString()).toBe('2025-04-21T20:00:00.000Z');
  });
});
