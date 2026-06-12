import request from 'supertest';
import app from '../../app';

describe('GET /api/health', () => {
  it('should return 200 OK and healthy status', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      status: 'healthy',
      timestamp: expect.any(String),
    });
  });
});

describe('GET /api/version', () => {
  it('should return 200 OK and version details', async () => {
    const response = await request(app).get('/api/version');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('version');
    expect(response.body.success).toBe(true);
  });
});
