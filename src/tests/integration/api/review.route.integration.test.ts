/**
 * @jest-environment node
 */

import express from 'express';
import request from 'supertest';

import { auth } from '@/app/(auth)/auth';
import { POST, DELETE } from '@/app/(review)/api/review/route';
import { createReview, deleteReview } from '@/lib/api/review';
import { generateUUID } from '@/lib/utils';

jest.mock('@/app/(auth)/auth', () => ({
  auth: jest.fn(),
}));

jest.mock('@/lib/api/review');

const mockedAuth = auth as jest.Mock;
const mockedCreateReview = createReview as jest.Mock;
const mockedDeleteReview = deleteReview as jest.Mock;

const app = express();
app.use(express.json());

app.post('/api/review', async (req, res) => {
  const url = `http://localhost${req.url}`;
  const requestObj = new Request(url, {
    method: 'POST',
    headers: Object.entries(req.headers).reduce<Record<string, string>>((acc, [key, value]) => {
      if (typeof value === 'string') {
        acc[key] = value;
      } else if (Array.isArray(value)) {
        acc[key] = value.join(', ');
      }
      return acc;
    }, {}),
    body: JSON.stringify(req.body),
  });
  const response = await POST(requestObj);
  const data = await response.json();
  res.status(response.status).json(data);
});

app.delete('/api/review', async (req, res) => {
  const url = `http://localhost${req.url}`;
  const requestObj = new Request(url, {
    method: 'DELETE',
    headers: Object.entries(req.headers).reduce<Record<string, string>>((acc, [key, value]) => {
      if (typeof value === 'string') {
        acc[key] = value;
      } else if (Array.isArray(value)) {
        acc[key] = value.join(', ');
      }
      return acc;
    }, {}),
  });
  const response = await DELETE(requestObj);
  const data = await response.json();
  res.status(response.status).json(data);
});

describe('API Route: /review (integration)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    jest.clearAllTimers();
  });

  it('POST /api/review - returns 200 when authenticated', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'user1' }, accessToken: 'token' });
    mockedCreateReview.mockResolvedValue({ reviewId: 'review123' });

    const response = await request(app).post('/api/review').send({
      id: generateUUID(),
      code: 'console.log("test");',
      review: 'Nice code',
      modelId: 'gpt-4o-mini',
      languageType: 'python',
    });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ reviewId: 'review123' });
  });

  it('POST /api/review - returns 401 when unauthenticated', async () => {
    mockedAuth.mockResolvedValue(null);

    const response = await request(app).post('/api/review').send({
      id: generateUUID(),
      code: 'console.log("test");',
      review: 'Nice code',
      modelId: 'gpt-4o-mini',
      languageType: 'python',
    });

    expect(response.status).toBe(401);
    expect(response.body.errorCode).toBe('UNAUTHORIZED');
  });

  it('DELETE /api/review - returns 200 when authenticated', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'user1' }, accessToken: 'token' });
    mockedDeleteReview.mockResolvedValue(undefined);

    const response = await request(app).delete('/api/review?id=123');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: 200 });
  });

  it('DELETE /api/review - returns 400 when no id provided', async () => {
    const response = await request(app).delete('/api/review');

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe('VALIDATION_ERROR');
  });
});
