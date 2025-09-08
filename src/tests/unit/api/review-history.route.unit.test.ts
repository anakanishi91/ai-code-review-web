/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';

import { auth } from '@/app/(auth)/auth';
import { GET } from '@/app/(review)/api/history/route';
import { getReviews } from '@/lib/api/review';

jest.mock('@/app/(auth)/auth', () => ({
  auth: jest.fn(),
}));
jest.mock('@/lib/api/review');

const mockedAuth = auth as jest.Mock;
const mockedGetReviews = getReviews as jest.Mock;

describe('GET /review (unit)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  function createRequest(query: Record<string, string | undefined> = {}) {
    const url = new URL('http://localhost/api/review');
    Object.entries(query).forEach(([k, v]) => v && url.searchParams.set(k, v));

    return new NextRequest(url);
  }

  it('returns reviews successfully', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'user1' }, accessToken: 'token' });
    mockedGetReviews.mockResolvedValue({ reviews: ['r1', 'r2'] });

    const res = await GET(createRequest({ limit: '5' }));
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual({ reviews: ['r1', 'r2'] });
    expect(mockedGetReviews).toHaveBeenCalledWith({
      limit: 5,
      startingAfter: null,
      endingBefore: null,
      token: 'token',
    });
  });

  it('returns 401 if unauthenticated', async () => {
    mockedAuth.mockResolvedValue(null);

    const res = await GET(createRequest());
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.errorCode).toBe('UNAUTHORIZED');
  });

  it('returns 400 if both starting_after and ending_before provided', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'user1' }, accessToken: 'token' });

    const res = await GET(createRequest({ starting_after: '1', ending_before: '2' }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.errorCode).toBe('VALIDATION_ERROR');
  });

  it('uses default limit if not provided', async () => {
    mockedAuth.mockResolvedValue({ user: { id: 'user1' }, accessToken: 'token' });
    mockedGetReviews.mockResolvedValue({ reviews: [] });

    await GET(createRequest());
    expect(mockedGetReviews).toHaveBeenCalledWith(expect.objectContaining({ limit: 10 }));
  });
});
