import {
  MOCK_OFF_ORIGIN_PATH,
  MOCK_OFF_ORIGIN_URL,
} from '@platform/testing/auth/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { toSafeCallbackPath } from './safe-callback-path';

describe(toSafeCallbackPath, () => {
  it.each([
    adminRoutes.home(),
    adminRoutes.dashboardLeads(),
    adminRoutes.tenants({ archived: true }),
  ])('keeps the same-origin path %s', (path) => {
    expect(toSafeCallbackPath(path)).toBe(path);
  });

  it.each([
    MOCK_OFF_ORIGIN_PATH,
    `/\\${MOCK_OFF_ORIGIN_PATH.slice(2)}`,
    `/\t${MOCK_OFF_ORIGIN_PATH}`,
    MOCK_OFF_ORIGIN_URL,
    '',
    undefined,
  ])('falls back to home for %j, which could leave this origin', (value) => {
    expect(toSafeCallbackPath(value)).toBe(adminRoutes.home());
  });
});
