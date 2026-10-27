import { faker } from '@faker-js/faker';
import {
  MOCK_OFF_ORIGIN_PATH,
  MOCK_OFF_ORIGIN_URL,
} from '@platform/testing/auth/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { toSafeCallbackPath } from './safe-callback-path';

faker.seed(6006);

describe(toSafeCallbackPath, () => {
  it.each([
    adminRoutes.home(),
    adminRoutes.dashboardLeads(),
    adminRoutes.tenants({ archived: true }),
    `${adminRoutes.tenantOverview(MOCK_TENANT_ID)}?${faker.word.noun()}=1#${faker.word.noun()}`,
  ])('keeps the same-origin path %s', (path) => {
    expect(toSafeCallbackPath(path)).toBe(path);
  });

  it.each([
    MOCK_OFF_ORIGIN_PATH,
    `/\\${MOCK_OFF_ORIGIN_PATH.slice(2)}`,
    `/\t${MOCK_OFF_ORIGIN_PATH}`,
    `/.${MOCK_OFF_ORIGIN_PATH}`,
    `/..${MOCK_OFF_ORIGIN_PATH}`,
    `/${faker.word.noun()}/..${MOCK_OFF_ORIGIN_PATH}`,
    `/%2e${MOCK_OFF_ORIGIN_PATH}`,
    MOCK_OFF_ORIGIN_URL,
    '',
    undefined,
  ])('falls back to home for %j, which could leave this origin', (value) => {
    expect(toSafeCallbackPath(value)).toBe(adminRoutes.home());
  });
});
