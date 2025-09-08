/**
 * @jest-environment node
 */

import express from 'express';
import { getToken } from 'next-auth/jwt';
import request from 'supertest';

import { GET } from '@/app/(auth)/api/auth/guest/route';
import { signIn } from '@/app/(auth)/auth';

jest.mock('@/app/(auth)/auth', () => ({
  signIn: jest.fn(),
}));
jest.mock('next-auth/jwt');

const mockedSignIn = signIn as jest.Mock;
const mockedGetToken = getToken as jest.Mock;

const app = express();

app.get('/api/auth/guest', async (req, res) => {
  const url = `http://localhost${req.url}`;
  const response = await GET(new Request(url));
  if (response.headers.get('location')) {
    res.redirect(response.status, response.headers.get('location')!);
  } else {
    const text = await response.text();
    res.status(response.status).send(text);
  }
});

describe('GET /api/auth/guest (integration)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('redirects to / if token exists', async () => {
    mockedGetToken.mockResolvedValue({ sub: 'user1' });

    const response = await request(app).get('/api/auth/guest');

    expect(response.status).toBe(307);
    expect(response.headers['location']).toBe('http://localhost/');
  });

  it('calls signIn and returns response if no token', async () => {
    mockedGetToken.mockResolvedValue(null);
    mockedSignIn.mockResolvedValue(new Response('signed in'));

    const response = await request(app).get('/api/auth/guest?redirectUrl=/dashboard');

    expect(mockedSignIn).toHaveBeenCalledWith('guest', {
      redirect: true,
      redirectTo: '/dashboard',
    });

    expect(response.text).toBe('signed in');
  });

  it('uses / as default redirectUrl', async () => {
    mockedGetToken.mockResolvedValue(null);
    mockedSignIn.mockResolvedValue(new Response('signed in'));

    await request(app).get('/api/auth/guest');

    expect(mockedSignIn).toHaveBeenCalledWith('guest', {
      redirect: true,
      redirectTo: '/',
    });
  });
});
