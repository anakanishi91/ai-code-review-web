import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as nextNavigation from 'next/navigation';
import * as nextAuth from 'next-auth/react';
import React from 'react';

import Page from '@/app/(auth)/login/page';
import { toast } from '@/components/toast';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next-auth/react', () => ({
  __esModule: true,
  useSession: jest.fn(),
}));

jest.mock('@/app/(auth)/auth', () => ({
  __esModule: true,
  GET: jest.fn(),
  POST: jest.fn(),
  auth: jest.fn(),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('@/components/toast', () => ({
  toast: jest.fn(),
}));

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockFormAction = jest.fn();
let mockState = { status: 'idle' };
jest.mock('react', () => {
  const actual = jest.requireActual('react');
  return {
    ...actual,
    useActionState: () => [mockState, mockFormAction],
  };
});

describe('<LoginPage /> integration', () => {
  const push = jest.fn();
  const refresh = jest.fn();
  const update = jest.fn();

  beforeEach(() => {
    (nextNavigation.useRouter as jest.Mock).mockReturnValue({ push, refresh });
    (nextAuth.useSession as jest.Mock).mockReturnValue({ update });

    jest.clearAllMocks();
    mockState = { status: 'idle' };
  });

  it('renders sign in form', () => {
    render(<Page />);
    expect(screen.getByRole('heading', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('calls formAction on submit', () => {
    render(<Page />);
    const form = screen.getByTestId('auth-form');
    fireEvent.submit(form);
    expect(mockFormAction).toHaveBeenCalled();
  });

  it('shows success state: updates session and navigates', async () => {
    mockState = { status: 'success' };
    render(<Page />);
    await waitFor(() => {
      expect(update).toHaveBeenCalled();
      expect(refresh).toHaveBeenCalled();
    });
  });

  it('shows failed toast for invalid credentials', async () => {
    mockState = { status: 'failed' };
    render(<Page />);
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        type: 'error',
        description: 'Invalid credentials!',
      });
    });
  });

  it('shows invalid_data toast', async () => {
    mockState = { status: 'invalid_data' };
    render(<Page />);
    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        type: 'error',
        description: 'Failed validating your submission!',
      });
    });
  });

  it('renders the link to register page', () => {
    render(<Page />);
    const link = screen.getByRole('link', { name: /sign up/i });
    expect(link).toHaveAttribute('href', '/register');
  });
});
