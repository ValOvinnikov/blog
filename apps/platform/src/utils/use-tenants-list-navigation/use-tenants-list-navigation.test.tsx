import {
  act,
  renderHook,
  type RenderHookResult,
} from '@platform/testing/custom-render';
import { mockLocaleRouter } from '@platform/testing/mock-locale-router';
import {
  mockTenantsListQuery,
  MOCK_TENANT_SLUG,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';
import { SORT_DIRECTION, TENANT_SORT_COLUMN } from '@shinefold/config';
import type { Mock } from 'vitest';

import { useTenantsListNavigation } from './use-tenants-list-navigation';

vi.mock('@platform/i18n/navigation');

const MOCK_LATER_PAGE = 4;
const MOCK_NAME_SORT = {
  column: TENANT_SORT_COLUMN.NAME,
  direction: SORT_DIRECTION.ASCENDING,
};

describe(useTenantsListNavigation, () => {
  let push: Mock;
  let replace: Mock;
  let hook: RenderHookResult<
    ReturnType<typeof useTenantsListNavigation>,
    unknown
  >;

  beforeEach(() => {
    ({ push, replace } = mockLocaleRouter());
    hook = renderHook(() =>
      useTenantsListNavigation(mockTenantsListQuery({ page: MOCK_LATER_PAGE })),
    );
  });

  it.each([
    { change: 'sort', changes: { sort: MOCK_NAME_SORT } },
    { change: 'visibility', changes: { shouldShowArchived: true } },
  ])('returns to the first page when the $change changes', ({ changes }) => {
    act(() => hook.result.current.navigate(changes));

    expect(push).toHaveBeenCalledExactlyOnceWith(
      adminRoutes.tenants({ ...changes, page: 1 }),
    );
  });

  it('returns to the first page when the search changes in place', () => {
    act(() =>
      hook.result.current.navigateInPlace({ search: MOCK_TENANT_SLUG }),
    );

    expect(replace).toHaveBeenCalledExactlyOnceWith(
      adminRoutes.tenants({ search: MOCK_TENANT_SLUG, page: 1 }),
    );
  });
});
