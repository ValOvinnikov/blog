import { act, renderHook } from '@platform/testing/custom-render';

import { useCollapseOnDone } from './use-collapse-on-done';

const renderCollapse = (isDone: boolean) =>
  renderHook(({ isDone: done }) => useCollapseOnDone(done), {
    initialProps: { isDone },
  });

describe(useCollapseOnDone, () => {
  it.each([
    { name: 'open when not done', isDone: false, isOpen: true },
    { name: 'collapsed when already done', isDone: true, isOpen: false },
  ])('starts $name', ({ isDone, isOpen }) => {
    const { result } = renderCollapse(isDone);

    expect(result.current.isOpen).toBe(isOpen);
  });

  it('auto-collapses the first time isDone flips to true', () => {
    const { result, rerender } = renderCollapse(false);

    rerender({ isDone: true });

    expect(result.current.isOpen).toBe(false);
  });

  it('keeps a user-reopened panel open while isDone stays true', () => {
    const { result, rerender } = renderCollapse(false);
    rerender({ isDone: true });

    act(() => {
      result.current.onOpenChange(true);
    });
    rerender({ isDone: true });

    expect(result.current.isOpen).toBe(true);
  });
});
