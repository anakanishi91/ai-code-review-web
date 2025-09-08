/**
 * @jest-environment node
 */

import express from 'express';
import { NextRequest } from 'next/server';
import request from 'supertest';

import { auth } from '@/app/(auth)/auth';
import { GET } from '@/app/(review)/api/history/route';
import { getReviews } from '@/lib/api/review';

jest.mock('@/app/(auth)/auth', () => ({
  auth: jest.fn(),
}));
jest.mock('@/lib/api/review');

const mockedAuth = auth as jest.Mock;
const mockedGetReviews = getReviews as jest.Mock;

const app = express();

app.get('/api/review', async (req, res) => {
  const url = new URL(`http://localhost${req.url}`);
  const requestObj = new NextRequest(url);
  const response = await GET(requestObj);
  const body = await response.json();
  res.status(response.status).json(body);
});

describe('GET /review (integration with supertest)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns reviews successfully', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'user1' }, accessToken: 'token' });
    mockedGetReviews.mockResolvedValue({ reviews: ['r1', 'r2'] });

    const response = await request(app).get('/api/review?limit=5');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ reviews: ['r1', 'r2'] });
  });

  it('returns 401 if unauthenticated', async () => {
    mockedAuth.mockResolvedValue(null);

    const response = await request(app).get('/api/review');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ errorCode: 'UNAUTHORIZED', message: '' });
  });

  it('returns 400 if both starting_after and ending_before provided', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'user1' }, accessToken: 'token' });

    const response = await request(app).get('/api/review?starting_after=1&ending_before=2');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      errorCode: 'VALIDATION_ERROR',
      message: 'Only one of starting_after or ending_before can be provided.',
    });
  });

  it('defaults limit to 10 if not provided', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'user1' }, accessToken: 'token' });
    mockedGetReviews.mockResolvedValue({ reviews: [] });

    await request(app).get('/api/review');

    expect(mockedGetReviews).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }));
  });
});
