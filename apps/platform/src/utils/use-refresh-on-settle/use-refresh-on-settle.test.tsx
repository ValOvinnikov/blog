import { renderHook } from '@platform/testing/custom-render';
import { mockRouterRefresh } from '@platform/testing/mock-router';

import { useRefreshOnSettle } from './use-refresh-on-settle';

const renderSettle = (isActive: boolean) =>
  renderHook(({ isActive: active }) => useRefreshOnSettle(active), {
    initialProps: { isActive },
  });

describe(useRefreshOnSettle, () => {
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    refresh = mockRouterRefresh();
  });

  it('refreshes the route once the activity it watched settles', () => {
    const { rerender } = renderSettle(true);

    rerender({ isActive: false });

    expect(refresh).toHaveBeenCalledOnce();
  });

  it.each([
    { name: 'stays active', from: true, to: true },
    { name: 'was never active', from: false, to: false },
    { name: 'only starts', from: false, to: true },
  ])('leaves the route alone while the activity $name', ({ from, to }) => {
    const { rerender } = renderSettle(from);

    rerender({ isActive: to });

    expect(refresh).not.toHaveBeenCalled();
  });
});
