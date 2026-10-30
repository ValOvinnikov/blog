import { adminRoutes } from '@platform/utils/routes/routes';

import { toRequestedPath } from './requested-path';

const MOCK_ORIGIN = 'https://admin.example.com';
const MOCK_QUERY = 'page=2';
const MOCK_CACHE_BUSTER = '_rsc=abc123';
const MOCK_ARCHIVED_QUERY = 'archived=1';

const toUrl = (pathWithQuery: string) => new URL(pathWithQuery, MOCK_ORIGIN);

describe(toRequestedPath, () => {
  it.each([
    {
      name: 'keeps the path and query of the requested page',
      requested: `${adminRoutes.dashboardLeads()}?${MOCK_QUERY}`,
      expected: `${adminRoutes.dashboardLeads()}?${MOCK_QUERY}`,
    },
    {
      name: 'returns the bare path when there is no query',
      requested: adminRoutes.tenants(),
      expected: adminRoutes.tenants(),
    },
    {
      name: 'drops the client-navigation cache-buster',
      requested: `${adminRoutes.tenants()}?${MOCK_ARCHIVED_QUERY}&${MOCK_CACHE_BUSTER}`,
      expected: adminRoutes.tenants({ shouldShowArchived: true }),
    },
  ])('$name', ({ requested, expected }) => {
    expect(toRequestedPath(toUrl(requested))).toBe(expected);
  });
});
