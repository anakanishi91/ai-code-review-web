import { User, UserSchema, UserWithToken, UserWithTokenSchema } from '../schemas/user';
import { fetchWithSchema } from '../utils';

const API_BASE_URL = process.env.API_BASE_URL ?? 'http://localhost:8000/api/v1';

export async function signup(email: string, password: string): Promise<User> {
  return await fetchWithSchema(
    `${API_BASE_URL}/auth/signup`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    },
    UserSchema,
  );
}

export async function signupGuest(): Promise<UserWithToken> {
  return await fetchWithSchema(
    `${API_BASE_URL}/auth/guest`,
    {
      method: 'POST',
      cache: 'no-store',
    },
    UserWithTokenSchema,
  );
}

export async function login(email: string, password: string): Promise<UserWithToken> {
  return await fetchWithSchema(
    `${API_BASE_URL}/auth/login`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
      cache: 'no-store',
    },
    UserWithTokenSchema,
  );
}
