import { act, renderHook } from '@platform/testing/custom-render';

type TPageOutOfDateModule = typeof import('./page-out-of-date');

describe('useIsPageOutOfDate', () => {
  let pageOutOfDate: TPageOutOfDateModule;
  let result: { current: boolean };

  beforeEach(async () => {
    vi.resetModules();
    pageOutOfDate = await import('./page-out-of-date');
    ({ result } = renderHook(() => pageOutOfDate.useIsPageOutOfDate()));
  });

  it('reports a current page', () => {
    expect(result.current).toBe(false);
  });

  it('reports the page out of date once it is marked', () => {
    act(() => pageOutOfDate.markPageOutOfDate());

    expect(result.current).toBe(true);
  });
});
