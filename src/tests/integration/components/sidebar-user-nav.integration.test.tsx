import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useParams } from 'next/navigation';
import * as nextAuth from 'next-auth/react';
import { ThemeProvider } from 'next-themes';

import { SidebarUserNav } from '@/components/sidebar-user-nav';
import * as toastModule from '@/components/toast';
import { SidebarProvider } from '@/components/ui/sidebar';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }),
  });

  class ResizeObserverMock {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, 'ResizeObserver', { value: ResizeObserverMock });
});

jest
  .spyOn(nextAuth, 'signOut')
  .mockImplementation((options) => Promise.resolve({ url: options?.redirectTo ?? '/' }));

function renderWithProviders() {
  return render(
    <ThemeProvider attribute="class">
      <SidebarProvider>
        <SidebarUserNav
          user={{ email: 'alice@example.com', type: 'regular', accessToken: 'accessToken' }}
        />
      </SidebarProvider>
    </ThemeProvider>,
  );
}

describe('SidebarUserNav - true integration', () => {
  const userEventSetup = userEvent.setup();
  const mockPush = jest.fn();
  const mockRefresh = jest.fn();
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    });

    (useParams as jest.Mock).mockReturnValue({ id: '123' });

    jest.spyOn(toastModule, 'toast').mockImplementation(jest.fn());

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders authenticated user, opens menu, toggles theme, and signs out', async () => {
    jest.spyOn(nextAuth, 'useSession').mockReturnValue({
      update: () => Promise.resolve(null),
      data: {
        user: {
          name: 'Alice',
          email: 'alice@example.com',
          id: 'testid',
          type: 'regular',
          accessToken: 'accessToken',
        },
        expires: '1',
      },
      status: 'authenticated',
    });

    renderWithProviders();

    expect(screen.getByTestId('user-email')).toHaveTextContent('alice@example.com');

    await userEventSetup.click(screen.getByTestId('user-nav-button'));
    const menu = await screen.findByTestId('user-nav-menu');

    const themeToggle = within(menu).getByTestId('user-nav-item-theme');
    await userEventSetup.click(themeToggle);

    await userEventSetup.click(screen.getByTestId('user-nav-button'));
    const menu2 = await screen.findByTestId('user-nav-menu');
    const authButton = within(menu2).getByRole('menuitem', { name: /Sign out/i });
    await userEventSetup.click(authButton);

    expect(nextAuth.signOut).toHaveBeenCalledWith({ redirectTo: '/' });
  });

  it('renders Guest user and redirects to /login', async () => {
    jest.spyOn(nextAuth, 'useSession').mockReturnValue({
      update: () => Promise.resolve(null),
      data: {
        user: {
          name: 'Guest',
          email: 'alice@example.com',
          id: 'testid',
          type: 'guest',
          accessToken: 'accessToken',
        },
        expires: '1',
      },
      status: 'authenticated',
    });

    renderWithProviders();

    expect(screen.getByTestId('user-email')).toHaveTextContent('Guest');

    await userEventSetup.click(screen.getByTestId('user-nav-button'));
    const menu = await screen.findByTestId('user-nav-menu');

    const authButton = within(menu).getByRole('menuitem', { name: /Login to your account/i });
    await userEventSetup.click(authButton);

    expect(nextAuth.signOut).not.toHaveBeenCalled();
  });

  it('shows loading state and displays toast when clicking auth button during loading', async () => {
    jest.spyOn(nextAuth, 'useSession').mockReturnValue({
      update: () => Promise.resolve(null),
      data: null,
      status: 'loading',
    });

    renderWithProviders();
    const userEventSetup = userEvent.setup();

    const loadingButton = screen.getByRole('button', { name: /Loading auth status/i });
    expect(loadingButton).toBeInTheDocument();

    await userEventSetup.click(loadingButton);
    const menu = await screen.findByTestId('user-nav-menu');

    const authButton = within(menu).getByRole('menuitem', { name: /Login to your account/i });
    await userEventSetup.click(authButton);

    expect(toastModule.toast).toHaveBeenCalledWith({
      type: 'error',
      description: 'Checking authentication status, please try again!',
    });
  });
});
