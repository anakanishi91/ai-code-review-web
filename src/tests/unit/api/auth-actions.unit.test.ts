import { login } from '@/app/(auth)/actions';
import { signIn } from '@/app/(auth)/auth';

jest.mock('@/app/(auth)/auth', () => ({
  signIn: jest.fn(),
}));

const mockedSignIn = signIn as jest.Mock;

describe('login server action', () => {
  beforeEach(() => jest.resetAllMocks());

  function createFormData(email: string, password: string) {
    const form = new FormData();
    form.set('email', email);
    form.set('password', password);
    return form;
  }

  it('returns success when valid credentials', async () => {
    mockedSignIn.mockResolvedValue({});
    const formData = createFormData('test@example.com', 'password123');

    const result = await login({ status: 'idle' }, formData);
    expect(result).toEqual({ status: 'success' });
    expect(mockedSignIn).toHaveBeenCalledWith('credentials', {
      email: 'test@example.com',
      password: 'password123',
      redirect: false,
    });
  });

  it('returns invalid_data when email is invalid', async () => {
    const formData = createFormData('invalid-email', 'password123');
    const result = await login({ status: 'idle' }, formData);
    expect(result).toEqual({ status: 'invalid_data' });
  });

  it('returns failed if signIn throws', async () => {
    mockedSignIn.mockRejectedValue(new Error('Network error'));
    const formData = createFormData('test@example.com', 'password123');

    const result = await login({ status: 'idle' }, formData);
    expect(result).toEqual({ status: 'failed' });
  });
});
