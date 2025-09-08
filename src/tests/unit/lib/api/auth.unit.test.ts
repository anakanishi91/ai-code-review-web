/**
 * @jest-environment node
 */

import { signup, signupGuest, login } from '@/lib/api/auth';
import { UserSchema, UserWithTokenSchema } from '@/lib/schemas/user';
import { fetchWithSchema } from '@/lib/utils';

jest.mock('@/lib/utils', () => ({
  fetchWithSchema: jest.fn(),
}));

describe('auth api', () => {
  const mockedFetchWithSchema = fetchWithSchema as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('calls fetchWithSchema with correct args', async () => {
      const fakeUser = { id: '1', email: 'test@example.com' };
      mockedFetchWithSchema.mockResolvedValue(fakeUser);

      const result = await signup('test@example.com', 'password123');

      expect(mockedFetchWithSchema).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/auth/signup',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
          cache: 'no-store',
        },
        UserSchema,
      );
      expect(result).toBe(fakeUser);
    });
  });

  describe('signupGuest', () => {
    it('calls fetchWithSchema with correct args', async () => {
      const fakeUserWithToken = { id: '1', email: 'guest@example.com', token: 'abc' };
      mockedFetchWithSchema.mockResolvedValue(fakeUserWithToken);

      const result = await signupGuest();

      expect(mockedFetchWithSchema).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/auth/guest',
        {
          method: 'POST',
          cache: 'no-store',
        },
        UserWithTokenSchema,
      );
      expect(result).toBe(fakeUserWithToken);
    });
  });

  describe('login', () => {
    it('calls fetchWithSchema with correct args', async () => {
      const fakeUserWithToken = { id: '1', email: 'test@example.com', token: 'xyz' };
      mockedFetchWithSchema.mockResolvedValue(fakeUserWithToken);

      const result = await login('test@example.com', 'mypassword');

      expect(mockedFetchWithSchema).toHaveBeenCalledWith(
        'http://localhost:8000/api/v1/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'test@example.com', password: 'mypassword' }),
          cache: 'no-store',
        },
        UserWithTokenSchema,
      );
      expect(result).toBe(fakeUserWithToken);
    });
  });
});
