export interface IHolidayProvider {
  // Se devuelve un Set de strings 'YYYY-MM-DD' para evitar problemas de timezone.
  getHolidays(year: number): Promise<Set<string>>;
}
