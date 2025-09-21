export class BaseError extends Error {
  public readonly statusCode: number;
  constructor(name: string, statusCode: number, message: string) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
  }
}

export class InvalidParametersError extends BaseError {
  constructor(message: string) {
    super("InvalidParameters", 400, message);
  }
}

export class HolidayApiError extends BaseError {
  constructor(message: string) {
    super("HolidayApiError", 503, "The holiday service is unavailable.");
  }
}
