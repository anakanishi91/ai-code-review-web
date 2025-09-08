/**
 * @jest-environment node
 */

import express from 'express';
import request from 'supertest';

import { auth } from '@/app/(auth)/auth';
import { POST } from '@/app/(review)/api/review/ai/route';
import { createReviewWithAI } from '@/lib/api/review';
import { generateUUID } from '@/lib/utils';

jest.mock('@/app/(auth)/auth', () => ({
  auth: jest.fn(),
}));
jest.mock('@/lib/api/review');

const mockedAuth = auth as jest.Mock;
const mockedCreateReviewWithAI = createReviewWithAI as jest.Mock;

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
  const text = await response.text();
  res.status(response.status).set(Object.fromEntries(response.headers)).send(text);
});

describe('POST /review (integration with supertest)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns event-stream on success', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'user1' }, accessToken: 'token' });
    mockedCreateReviewWithAI.mockResolvedValue({ body: 'event-stream-data' });

    const response = await request(app).post('/api/review').send({
      id: generateUUID(),
      code: 'console.log("test");',
      modelId: 'gpt-4o-mini',
      languageType: 'python',
    });

    expect(response.status).toBe(200);
    expect(response.header['content-type']).toContain('text/event-stream');
    expect(response.text).toBe('event-stream-data');
  });

  it('returns 401 if unauthenticated', async () => {
    mockedAuth.mockResolvedValue(null);

    const response = await request(app).post('/api/review').send({
      id: generateUUID(),
      code: 'console.log("test");',
      modelId: 'gpt-4o-mini',
      languageType: 'python',
    });

    expect(response.status).toBe(401);
    expect(response.body.errorCode).toBe('UNAUTHORIZED');
  });

  it('returns 400 on validation error', async () => {
    const response = await request(app).post('/api/review').send({ invalid: 'data' });

    expect(response.status).toBe(400);
    expect(response.body.errorCode).toBe('VALIDATION_ERROR');
  });
});
