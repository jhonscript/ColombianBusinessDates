import { IDateCalculator, IDateCalculatorParams } from '../../../domain/ports/IDateCalculator';
import { IHolidayProvider } from '../../../domain/ports/IHolidayProvider';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export class DateCalculatorService implements IDateCalculator {
  private readonly BOGOTA_TIMEZONE = 'America/Bogota';
  private readonly WORKDAY_START_HOUR = 8;
  private readonly LUNCH_START_HOUR = 12;
  private readonly LUNCH_END_HOUR = 13;
  private readonly WORKDAY_END_HOUR = 17;

  constructor(private holidayProvider: IHolidayProvider) {}

  //=========== PUBLIC METHOD ===========

  public async calculateBusinessDate(params: IDateCalculatorParams): Promise<Date> {
    const { startDate, days = 0, hours = 0 } = params;

    let currentDate = toZonedTime(startDate, this.BOGOTA_TIMEZONE);
    const holidays = await this.holidayProvider.getHolidays(currentDate.getFullYear());
    // A more robust implementation would fetch holidays for subsequent years if the calculation spans across years.

    currentDate = this._adjustStartDate(currentDate, holidays);
    currentDate = this._addBusinessDays(currentDate, days, holidays);
    currentDate = this._addBusinessMinutes(currentDate, hours * 60, holidays);

    return fromZonedTime(currentDate, this.BOGOTA_TIMEZONE);
  }

  //=========== PRIVATE HELPER METHODS ===========

  /**
   * Adjusts the start date backwards to the last valid business moment if it's not already one.
   */
  private _adjustStartDate(date: Date, holidays: Set<string>): Date {
    let currentDate = new Date(date);
    if (this.isBusinessTime(currentDate, holidays)) {
      return currentDate; // No adjustment needed
    }

    const hour = currentDate.getHours();

    if (this.isBusinessDay(currentDate, holidays)) {
      if (hour >= this.WORKDAY_END_HOUR) {
        currentDate.setHours(this.WORKDAY_END_HOUR, 0, 0, 0);
      } else if (hour === this.LUNCH_START_HOUR) {
        currentDate.setHours(this.LUNCH_START_HOUR, 0, 0, 0);
      } else { // hour < WORKDAY_START_HOUR
        currentDate.setDate(currentDate.getDate() - 1);
        while (!this.isBusinessDay(currentDate, holidays)) {
          currentDate.setDate(currentDate.getDate() - 1);
        }
        currentDate.setHours(this.WORKDAY_END_HOUR, 0, 0, 0);
      }
    } else { // The day itself is not a business day
      while (!this.isBusinessDay(currentDate, holidays)) {
        currentDate.setDate(currentDate.getDate() - 1);
      }
      currentDate.setHours(this.WORKDAY_END_HOUR, 0, 0, 0);
    }
    return currentDate;
  }

  /**
   * Adds a given number of business days to a date.
   */
  private _addBusinessDays(date: Date, days: number, holidays: Set<string>): Date {
    if (days <= 0) {
      return date;
    }
    let currentDate = new Date(date);
    for (let i = 0; i < days; i++) {
      currentDate.setDate(currentDate.getDate() + 1);
      while (!this.isBusinessDay(currentDate, holidays)) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    return currentDate;
  }

  /**
   * Adds a given number of business minutes to a date, advancing through valid business time blocks.
   */
  private _addBusinessMinutes(date: Date, minutesToAdd: number, holidays: Set<string>): Date {
    if (minutesToAdd <= 0) {
      return date;
    }
    let currentDate = new Date(date);
    let remainingMinutes = minutesToAdd;

    while (remainingMinutes > 0) {
      if (this.isBusinessTime(currentDate, holidays)) {
        const currentMinute = currentDate.getMinutes();
        const currentHour = currentDate.getHours();

        let minutesInBlock: number;
        if (currentHour < this.LUNCH_START_HOUR) { // Morning block
          minutesInBlock = (this.LUNCH_START_HOUR * 60) - (currentHour * 60 + currentMinute);
        } else { // Afternoon block
          minutesInBlock = (this.WORKDAY_END_HOUR * 60) - (currentHour * 60 + currentMinute);
        }

        const minutesToConsume = Math.min(remainingMinutes, minutesInBlock);

        currentDate.setMinutes(currentDate.getMinutes() + minutesToConsume);
        remainingMinutes -= minutesToConsume;
      } else {
        const currentHour = currentDate.getHours();
        if (currentHour < this.WORKDAY_START_HOUR) {
          currentDate.setHours(this.WORKDAY_START_HOUR, 0, 0, 0);
        } else if (currentHour === this.LUNCH_START_HOUR) {
          currentDate.setHours(this.LUNCH_END_HOUR, 0, 0, 0);
        } else { // After WORKDAY_END_HOUR or on a non-business day
          currentDate.setDate(currentDate.getDate() + 1);
          currentDate.setHours(this.WORKDAY_START_HOUR, 0, 0, 0);
          while (!this.isBusinessDay(currentDate, holidays)) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
        }
      }
    }
    return currentDate;
  }

  //=========== BOOLEAN CHECKS ===========

  private isHoliday(date: Date, holidays: Set<string>): boolean {
    const dateString = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
    return holidays.has(dateString);
  }

  private isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0 || day === 6; // 0=Sunday, 6=Saturday
  }

  private isBusinessDay(date: Date, holidays: Set<string>): boolean {
    return !this.isWeekend(date) && !this.isHoliday(date, holidays);
  }

  private isBusinessTime(date: Date, holidays: Set<string>): boolean {
    const hour = date.getHours();
    return this.isBusinessDay(date, holidays) && hour >= this.WORKDAY_START_HOUR && hour < this.WORKDAY_END_HOUR && hour !== this.LUNCH_START_HOUR;
  }
}
