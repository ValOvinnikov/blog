import { routing } from '@platform/i18n/routing';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_SLUG,
} from '@platform/testing/tenants/fixtures';
import { DEFAULT_TENANTS_SORT } from '@platform/utils/tenants-list-query/tenants-list-query';
import { SORT_DIRECTION, TENANT_SORT_COLUMN } from '@shinefold/config';

import { adminRoutes, STUDIO_SEGMENT } from './routes';

const MOCK_TENANTS_PAGE = 3;

describe('adminRoutes', () => {
  it('keeps the locale out of the Studio basePaths', () => {
    expect(routing.localePrefix).toBe('never');

    expect(adminRoutes.dashboardStudio()).toBe(`/dashboard/${STUDIO_SEGMENT}`);
    expect(adminRoutes.tenantStudio(MOCK_TENANT_ID)).toBe(
      `/tenants/${MOCK_TENANT_ID}/${STUDIO_SEGMENT}`,
    );
  });

  it('puts a draft id in the preview routes as one path segment', () => {
    const draftId = `drafts.${MOCK_TENANT_SLUG}/x`;
    const encodedId = encodeURIComponent(draftId);

    expect(adminRoutes.dashboardDraftPreview(draftId)).toBe(
      `/dashboard/preview/${encodedId}`,
    );
    expect(adminRoutes.tenantDraftPreview(MOCK_TENANT_ID, draftId)).toBe(
      `/tenants/${MOCK_TENANT_ID}/preview/${encodedId}`,
    );
  });

  describe('tenantSubscribers', () => {
    it('links the first page with no page parameter', () => {
      expect(adminRoutes.tenantSubscribers(MOCK_TENANT_ID)).toBe(
        `/tenants/${MOCK_TENANT_ID}/subscribers`,
      );
    });

    it('carries a later page', () => {
      expect(adminRoutes.tenantSubscribers(MOCK_TENANT_ID, 2)).toBe(
        `/tenants/${MOCK_TENANT_ID}/subscribers?page=2`,
      );
    });
  });

  describe('tenants', () => {
    it('leaves the default visibility, sort and search out of the URL', () => {
      const href = adminRoutes.tenants({
        shouldShowArchived: false,
        sort: DEFAULT_TENANTS_SORT,
        search: '',
      });

      expect(href).toBe('/tenants');
    });

    it('carries the archived flag, a chosen sort and the search', () => {
      const href = adminRoutes.tenants({
        shouldShowArchived: true,
        sort: {
          column: TENANT_SORT_COLUMN.CREATED,
          direction: SORT_DIRECTION.ASCENDING,
        },
        search: MOCK_TENANT_SLUG,
      });

      expect(href).toBe(
        `/tenants?archived=1&sort=CREATED&direction=ascending&q=${MOCK_TENANT_SLUG}`,
      );
    });

    it('leaves the first page out of the URL', () => {
      const href = adminRoutes.tenants({ page: 1 });

      expect(href).toBe('/tenants');
    });

    it('carries a later page after the other parameters', () => {
      const href = adminRoutes.tenants({
        shouldShowArchived: true,
        search: MOCK_TENANT_SLUG,
        page: MOCK_TENANTS_PAGE,
      });

      expect(href).toBe(
        `/tenants?archived=1&q=${MOCK_TENANT_SLUG}&page=${MOCK_TENANTS_PAGE}`,
      );
    });
  });
});
