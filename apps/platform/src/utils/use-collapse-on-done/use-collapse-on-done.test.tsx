import { act, renderHook } from '@testing-library/react';

import { useCollapseOnDone } from './use-collapse-on-done';

describe(useCollapseOnDone, () => {
  it('starts open when not done', () => {
    const { result } = renderHook(() => useCollapseOnDone(false));

    expect(result.current.isOpen).toBe(true);
  });

  it('starts collapsed when already done on mount', () => {
    const { result } = renderHook(() => useCollapseOnDone(true));

    expect(result.current.isOpen).toBe(false);
  });

  it('auto-collapses the first time isDone flips to true', () => {
    const { result, rerender } = renderHook(
      ({ isDone }) => useCollapseOnDone(isDone),
      { initialProps: { isDone: false } },
    );

    expect(result.current.isOpen).toBe(true);

    rerender({ isDone: true });

    expect(result.current.isOpen).toBe(false);
  });

  it('does not re-collapse a user-reopened panel on a later render with isDone unchanged', () => {
    const { result, rerender } = renderHook(
      ({ isDone }) => useCollapseOnDone(isDone),
      { initialProps: { isDone: false } },
    );

    rerender({ isDone: true });
    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.onOpenChange(true);
    });
    expect(result.current.isOpen).toBe(true);

    rerender({ isDone: true });

    expect(result.current.isOpen).toBe(true);
  });
});
