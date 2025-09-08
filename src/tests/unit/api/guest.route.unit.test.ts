/**
 * @jest-environment node
 */

import { getToken } from 'next-auth/jwt';

import { GET } from '@/app/(auth)/api/auth/guest/route';
import { signIn } from '@/app/(auth)/auth';

jest.mock('@/app/(auth)/auth', () => ({
  signIn: jest.fn(),
}));
jest.mock('next-auth/jwt');
jest.mock('@/lib/constants', () => ({
  isDevelopmentEnvironment: true,
}));

const mockedSignIn = signIn as jest.Mock;
const mockedGetToken = getToken as jest.Mock;

describe('GET /api/auth/guest (unit)', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  function createRequest(url: string) {
    return new Request(url);
  }

  it('redirects to / if token exists', async () => {
    mockedGetToken.mockResolvedValue({ sub: 'user1' });

    const request = createRequest('http://localhost/api/auth/guest');
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('http://localhost/');
  });

  it('calls signIn with guest if no token', async () => {
    mockedGetToken.mockResolvedValue(null);
    mockedSignIn.mockResolvedValue(new Response('signed in'));

    const request = createRequest('http://localhost/api/auth/guest?redirectUrl=/dashboard');
    const response = await GET(request);

    expect(mockedSignIn).toHaveBeenCalledWith('guest', {
      redirect: true,
      redirectTo: '/dashboard',
    });

    const text = await response.text();
    expect(text).toBe('signed in');
  });

  it('uses / as default redirectUrl', async () => {
    mockedGetToken.mockResolvedValue(null);
    mockedSignIn.mockResolvedValue(new Response('signed in'));

    const request = createRequest('http://localhost/api/auth/guest');
    await GET(request);

    expect(mockedSignIn).toHaveBeenCalledWith('guest', {
      redirect: true,
      redirectTo: '/',
    });
  });
});
