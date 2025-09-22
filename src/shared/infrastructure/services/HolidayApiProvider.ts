import axios from 'axios';
import { IHolidayProvider } from '../../../domain/ports/IHolidayProvider';
import { HolidayApiError } from '../../../domain/errors';
import { z } from 'zod';

// Esquema para validar la respuesta de la API de festivos
const holidayResponseSchema = z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/));

export class HolidayApiProvider implements IHolidayProvider {
  private readonly HOLIDAY_API_URL = 'https://content.capta.co/Recruitment/WorkingDays.json';
  private cache: Map<number, Set<string>> = new Map();

  async getHolidays(year: number): Promise<Set<string>> {
    if (this.cache.has(year)) {
      return this.cache.get(year)!;
    }

    try {
      const response = await axios.get<string[]>(this.HOLIDAY_API_URL);

      const validation = holidayResponseSchema.safeParse(response.data);

      if (!validation.success) {
        // Aquí se podría loggear el error de validación `validation.error`
        throw new HolidayApiError('Invalid data format received from holiday API.');
      }

      // Filtramos los festivos por el año solicitado y los metemos en un Set
      const holidaysForYear = new Set(
        validation.data.filter(holiday => holiday.startsWith(year.toString()))
      );

      this.cache.set(year, holidaysForYear);
      return holidaysForYear;

    } catch (error) {
      // Aquí se podría loggear el error original `error`
      if (error instanceof HolidayApiError) {
        throw error;
      }
      throw new HolidayApiError('The holiday service is unavailable.');
    }
  }
}