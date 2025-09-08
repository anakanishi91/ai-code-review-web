import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { subDays } from 'date-fns';
import * as nextNavigation from 'next/navigation';
import { toast } from 'sonner';
import * as swr from 'swr/infinite';

import { SidebarHistory } from '@/components/sidebar-history';
import * as sidebarHook from '@/components/ui/sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Review } from '@/lib/schemas/review';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('@/components/ui/sidebar', () => {
  const original = jest.requireActual('@/components/ui/sidebar');
  return {
    ...original,
    useSidebar: jest.fn(),
  };
});

beforeAll(() => {
  global.fetch = jest.fn();
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

  class IntersectionObserverMock {
    observe = jest.fn();
    unobserve = jest.fn();
    disconnect = jest.fn();
  }
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: IntersectionObserverMock,
  });
});

afterAll(() => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (global as any).fetch;
});

beforeEach(() => {
  (global.fetch as jest.Mock).mockReset();
});

describe('SidebarHistory - integration', () => {
  const userEventSetup = userEvent.setup();

  const mockReviews: Review[] = [
    {
      id: '1',
      createdAt: new Date(),
      code: 'code',
      review: 'Today review',
      chatModelId: 'gpt-4o-mini',
      programmingLanguage: 'python',
    },
    {
      id: '2',
      createdAt: subDays(new Date(), 1),
      code: 'code',
      review: 'Yesterday review',
      chatModelId: 'gpt-4o-mini',
      programmingLanguage: 'python',
    },
  ];

  beforeEach(() => {
    jest.spyOn(swr, 'default').mockReturnValue({
      data: [{ reviews: mockReviews, hasMore: true }],
      setSize: jest.fn(),
      isValidating: false,
      isLoading: false,
      mutate: jest.fn(),
      size: 0,
      error: undefined,
    });

    (nextNavigation.useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (nextNavigation.useParams as jest.Mock).mockReturnValue({ id: '1' });

    (sidebarHook.useSidebar as jest.Mock).mockReturnValue({
      setOpenMobile: jest.fn(),
    });

    jest.spyOn(toast, 'promise').mockImplementation(jest.fn());
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  function renderWithProviders() {
    return render(
      <SidebarProvider>
        <SidebarHistory
          user={{ email: 'alice@example.com', type: 'regular', accessToken: 'accessToken' }}
        />
      </SidebarProvider>,
    );
  }

  it('renders grouped reviews correctly', async () => {
    renderWithProviders();

    expect(screen.getByText('Today')).toBeInTheDocument();
    expect(screen.getByText('Today review')).toBeInTheDocument();

    expect(screen.getByText('Yesterday')).toBeInTheDocument();
    expect(screen.getByText('Yesterday review')).toBeInTheDocument();
  });

  it('opens delete menu and calls toast on delete', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    renderWithProviders();

    const reviewItem = await screen.findByText('Today review');

    const moreButton = reviewItem.closest('div')!.querySelector('button')!;
    await userEventSetup.click(moreButton);

    const deleteButton = await screen.findByRole('menuitem', { name: /delete/i });
    await userEventSetup.click(deleteButton);

    const continueButton = await screen.findByText('Continue');
    await userEventSetup.click(continueButton);

    expect(toast.promise).toHaveBeenCalledWith(
      expect.any(Promise),
      expect.objectContaining({
        loading: 'Deleting review...',
        success: expect.any(Function),
        error: 'Failed to delete review',
      }),
    );
  });

  it('renders empty state when no reviews', () => {
    jest.spyOn(swr, 'default').mockReturnValue({
      data: [{ reviews: [], hasMore: true }],
      setSize: jest.fn(),
      isValidating: false,
      isLoading: false,
      mutate: jest.fn(),
      size: 0,
      error: undefined,
    });

    renderWithProviders();

    expect(
      screen.getByText('Your conversations will appear here once you start review!'),
    ).toBeInTheDocument();
  });

  it('renders loading skeletons when loading', async () => {
    jest.spyOn(swr, 'default').mockReturnValue({
      data: [],
      setSize: jest.fn(),
      isValidating: false,
      isLoading: true,
      mutate: jest.fn(),
      size: 0,
      error: undefined,
    });

    renderWithProviders();

    expect(screen.getByText('Today')).toBeInTheDocument();
    const skeletons = await screen.findAllByTestId('loading-skeleton');
    expect(skeletons).toHaveLength(5);
  });
});
