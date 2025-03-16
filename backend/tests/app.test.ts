import request from 'supertest';
import { createApp } from '../src/app';
import type { Express } from 'express';

describe('Application Tests', () => {
  const app: Express = createApp();

  describe('Health Check', () => {
    it('should return 200 and status ok', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('API Routes', () => {
    it('should handle invalid routes', async () => {
      const response = await request(app).get('/api/invalid-route');
      expect(response.status).toBe(404);
    });
  });
});
