import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as nextNavigation from 'next/navigation';
import React from 'react';
import { SWRConfig } from 'swr';
import { TextEncoder } from 'util';

import { Review } from '@/components/review';
import { toast } from '@/components/toast';
import * as sidebarHook from '@/components/ui/sidebar';
import * as utils from '@/lib/utils';
import * as webllmClient from '@/lib/webllm/client/webllm';

jest.mock('@/components/toast', () => ({
  toast: jest.fn(),
}));

// eslint-disable-next-line react/display-name
jest.mock('react-markdown', () => (props: React.ComponentProps<'div'>) => {
  return <div data-testid="mock-markdown">{props.children}</div>;
});

jest.mock('remark-gfm', () => () => {
  return () => {};
});

jest.mock('@codemirror/view', () => ({
  EditorView: jest.fn().mockImplementation(() => ({
    state: { doc: { toString: () => 'mocked code' } },
    setState: jest.fn(),
    destroy: jest.fn(),
  })),
}));

jest.mock('@codemirror/autocomplete', () => ({
  autocompletion: jest.fn(() => ({})),
}));

jest.mock('@codemirror/lang-javascript', () => ({
  javascript: jest.fn().mockReturnValue('js-extension'),
}));

jest.mock('@codemirror/lang-python', () => ({
  python: jest.fn().mockReturnValue('py-extension'),
}));

jest.mock('codemirror', () => ({
  basicSetup: 'basic-setup',
}));

jest.mock('@codemirror/state', () => ({
  EditorState: {
    create: jest.fn(),
    setState: jest.fn(),
  },
}));

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

jest.spyOn(utils, 'generateUUID').mockReturnValue('test-uuid');

global.fetch = jest.fn();

const mockChat = jest.fn(async (_prompt, _modelId, onMessage) => {
  onMessage('webllm response');
  return 'webllm response';
});

jest.spyOn(webllmClient, 'WebLLMApi').mockImplementation(function () {
  const instance = Object.create(webllmClient.WebLLMApi.prototype);
  instance.engine = {};
  instance.chat = mockChat;
  return instance;
});

describe('Review Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();

    (nextNavigation.useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
    (nextNavigation.useParams as jest.Mock).mockReturnValue({ id: '1' });

    (sidebarHook.useSidebar as jest.Mock).mockReturnValue({
      setOpenMobile: jest.fn(),
    });
  });

  it('renders initial code and review, sends code using online model', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      body: {
        getReader: () => ({
          read: jest
            .fn()
            .mockResolvedValueOnce({
              value: new TextEncoder().encode('api response'),
              done: false,
            })
            .mockResolvedValueOnce({
              value: undefined,
              done: true,
            }),
          releaseLock: jest.fn(),
        }),
      },
    });

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <Review
          initialCode="console.log('hello');"
          initialReview="Initial review"
          initialChatModelId="gpt-4o-mini"
          initialLanguageType="javascript"
        />
      </SWRConfig>,
    );

    expect(screen.getByText('Initial review')).toBeInTheDocument();

    const sendButton = screen.getByRole('button', { name: /Submit Code/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/review/ai', expect.any(Object));
      expect(screen.getByText(/api response/)).toBeInTheDocument();
    });
  });

  it('sends code using WebLLMApi when offline model', async () => {
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <Review
          initialCode="console.log('offline');"
          initialReview={null}
          initialChatModelId="TinySwallow-1.5B"
          initialLanguageType="javascript"
        />
      </SWRConfig>,
    );

    const sendButton = screen.getByRole('button', { name: /Submit Code/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockChat).toHaveBeenCalled();
      expect(fetch).toHaveBeenCalledWith('/api/review', expect.any(Object));
      expect(screen.getByText('webllm response')).toBeInTheDocument();
    });
  });

  it('shows toast on error', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <Review
          initialCode="console.log('error');"
          initialReview={null}
          initialChatModelId="gpt-4o-mini"
          initialLanguageType="javascript"
        />
      </SWRConfig>,
    );

    const sendButton = screen.getByRole('button', { name: /Submit Code/i });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'error', description: 'Network error' }),
      );
    });
  });
});
