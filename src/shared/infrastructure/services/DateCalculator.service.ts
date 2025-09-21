import { IDateCalculator, IDateCalculatorParams } from '../../../domain/ports/IDateCalculator';
import { IHolidayProvider } from '../../../domain/ports/IHolidayProvider';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export class DateCalculatorService implements IDateCalculator {
  private readonly BOGOTA_TIMEZONE = 'America/Bogota';

  constructor(private holidayProvider: IHolidayProvider) {}

  private isHoliday(date: Date, holidays: Set<string>): boolean {
    const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    return holidays.has(dateString);
  }

  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // 0=Domingo, 6=Sábado
  }

  private isBusinessDay(date: Date, holidays: Set<string>): boolean {
    return !this.isWeekend(date) && !this.isHoliday(date, holidays);
  }

  async calculateBusinessDate(params: IDateCalculatorParams): Promise<Date> {
    const { startDate, days = 0, hours = 0 } = params;

    let currentDate = toZonedTime(startDate, this.BOGOTA_TIMEZONE);
    const holidays = await this.holidayProvider.getHolidays(currentDate.getFullYear());
    // En una implementación más robusta, se cargarían festivos de años futuros si el rango de fechas es amplio.

    // --- Lógica de Cálculo Principal ---

    if (days > 0) {
      // Si la fecha de inicio no es un día hábil, o es un día hábil pero después de las 5pm, 
      // ajustamos al final del día hábil anterior.
      if (!this.isBusinessDay(currentDate, holidays) || currentDate.getHours() >= 17) {
        // Retrocedemos día por día hasta encontrar un día hábil
        while (!this.isBusinessDay(currentDate, holidays)) {
          currentDate.setDate(currentDate.getDate() - 1);
        }
        currentDate.setHours(17, 0, 0, 0); // Fin del día laboral
      }

      for (let i = 0; i < days; i++) {
        currentDate.setDate(currentDate.getDate() + 1);
        while (!this.isBusinessDay(currentDate, holidays)) {
          currentDate.setDate(currentDate.getDate() + 1);
        }
      }
    }

    let remainingHours = hours;
    if (remainingHours > 0) {
      // Si solo se suman horas (no días), y estamos fuera de horario, saltamos al siguiente momento hábil.
      if (days === 0) {
        let hour = currentDate.getHours();
        if (!this.isBusinessDay(currentDate, holidays) || hour >= 17) {
          currentDate.setDate(currentDate.getDate() + 1);
          while (!this.isBusinessDay(currentDate, holidays)) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
          currentDate.setHours(8, 0, 0, 0); // Inicio del siguiente día laboral
        } else if (hour < 8) {
          currentDate.setHours(8, 0, 0, 0);
        } else if (hour === 12) {
          currentDate.setHours(13, 0, 0, 0);
        }
      }

      while (remainingHours > 0) {
        let hour = currentDate.getHours();
        if (hour >= 8 && hour < 12 || hour >= 13 && hour < 17) {
          currentDate.setHours(hour + 1);
          remainingHours--;
        } else {
          // Si no es hora hábil, simplemente avanzamos la hora para llegar a la siguiente ventana hábil.
          currentDate.setHours(hour + 1);
          // Si al avanzar la hora cambiamos de día, buscamos el siguiente día hábil.
          if(currentDate.getHours() < hour) { // Detecta el cambio de día (e.g., de 23:00 a 00:00)
             while (!this.isBusinessDay(currentDate, holidays)) {
                currentDate.setDate(currentDate.getDate() + 1);
             }
          }
        }
      }
    }

    return fromZonedTime(currentDate, this.BOGOTA_TIMEZONE);
  }
}