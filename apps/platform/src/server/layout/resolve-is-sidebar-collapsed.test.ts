import { mockCookies } from '@platform/testing/mock-cookies';
import {
  LEGACY_SIDEBAR_COLLAPSED_COOKIE,
  SIDEBAR_COLLAPSED_COOKIE,
} from '@platform/utils/sidebar-collapsed-cookie/sidebar-collapsed-cookie';

import { resolveIsSidebarCollapsed } from './resolve-is-sidebar-collapsed';

const COLLAPSED = String(true);
const EXPANDED = String(false);

describe(resolveIsSidebarCollapsed, () => {
  it.each([
    { cookie: 'absent', value: undefined, expected: false },
    {
      cookie: `anything other than "${COLLAPSED}"`,
      value: '1',
      expected: false,
    },
    { cookie: `"${COLLAPSED}"`, value: COLLAPSED, expected: true },
  ])(
    'resolves $expected when the cookie is $cookie',
    async ({ value, expected }) => {
      mockCookies({ [SIDEBAR_COLLAPSED_COOKIE]: value });

      expect(await resolveIsSidebarCollapsed()).toBe(expected);
    },
  );

  it('keeps a state saved under the legacy cookie', async () => {
    mockCookies({ [LEGACY_SIDEBAR_COLLAPSED_COOKIE]: COLLAPSED });

    expect(await resolveIsSidebarCollapsed()).toBe(true);
  });

  it('prefers the current cookie over the legacy one', async () => {
    mockCookies({
      [SIDEBAR_COLLAPSED_COOKIE]: EXPANDED,
      [LEGACY_SIDEBAR_COLLAPSED_COOKIE]: COLLAPSED,
    });

    expect(await resolveIsSidebarCollapsed()).toBe(false);
  });
});
