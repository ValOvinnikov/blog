import { renderHook } from '@platform/testing/custom-render';

import { useRelativeTimeTick } from './use-relative-time-tick';

describe(useRelativeTimeTick, () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('clears its interval on unmount, leaving no timer behind', () => {
    const { unmount } = renderHook(() => useRelativeTimeTick());

    expect(vi.getTimerCount()).toBe(1);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
