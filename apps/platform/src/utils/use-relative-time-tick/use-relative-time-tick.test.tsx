import { renderHook } from '@testing-library/react';

import { useRelativeTimeTick } from './use-relative-time-tick';

describe(useRelativeTimeTick, () => {
  it('clears its interval on unmount, leaving no timer behind', () => {
    vi.useFakeTimers();
    expect(vi.getTimerCount()).toBe(0);

    const { unmount } = renderHook(() => useRelativeTimeTick());
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);

    vi.useRealTimers();
  });
});
