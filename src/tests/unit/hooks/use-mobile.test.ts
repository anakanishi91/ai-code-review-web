import { renderHook, act } from '@testing-library/react';

import { useIsMobile } from '@/hooks/use-mobile';

describe('useIsMobile', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  function mockMatchMedia(matches: boolean) {
    return {
      matches,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    };
  }

  it('returns true when window.innerWidth is less than MOBILE_BREAKPOINT', () => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });
    window.matchMedia = jest.fn().mockImplementation(() => mockMatchMedia(true));

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it('returns false when window.innerWidth is greater than or equal to MOBILE_BREAKPOINT', () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
    window.matchMedia = jest.fn().mockImplementation(() => mockMatchMedia(false));

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('updates when matchMedia change event occurs', () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    let listener: Function;
    window.innerWidth = 1024;
    window.matchMedia = jest.fn().mockImplementation(() => ({
      matches: false,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
      addEventListener: (_: string, cb: Function) => {
        listener = cb;
      },
      removeEventListener: jest.fn(),
    }));

    const { result } = renderHook(() => useIsMobile());

    expect(result.current).toBe(false);

    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 500 });

    act(() => {
      listener({ matches: true });
    });

    expect(result.current).toBe(true);
  });
});
