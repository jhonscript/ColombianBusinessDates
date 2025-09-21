import request from 'supertest';
import app from '../../shared/web/App'; // Importamos nuestra aplicación Express

describe('GET /calculate', () => {
  it('should return 400 if no parameters are provided', async () => {
    const response = await request(app).get('/calculate');
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('InvalidParameters');
  });

  it('should return 400 for invalid date format', async () => {
    const response = await request(app).get('/calculate?date=invalid-date&days=1');
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('InvalidParameters');
  });

  it('should return 400 for days < 1', async () => {
    const response = await request(app).get('/calculate?days=0');
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('InvalidParameters');
  });

  // Este es un test E2E que depende de la API externa de festivos.
  // En un escenario real, se usaría nock para mockear la respuesta de la API.
  it('should return a calculated date for a valid request (E2E test)', async () => {
    const response = await request(app).get('/calculate?date=2025-09-19T20:00:00.000Z&hours=1');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('date');
    // Viernes 3pm CO + 1 hora = Viernes 4pm CO -> 2025-09-19T21:00:00.000Z
    expect(response.body.date).toBe('2025-09-19T21:00:00.000Z');
  });
});
