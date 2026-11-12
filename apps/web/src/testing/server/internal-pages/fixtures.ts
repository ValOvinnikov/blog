import type { TInternalPageRouteContext } from '@web/server/internal-pages/respond-to-internal-page-request/respond-to-internal-page-request';
import { createMockFaker } from '@web/testing/mock-faker';

const mockFaker = createMockFaker(7184);

export const MOCK_INTERNAL_PAGE_ID = mockFaker.string.uuid();

export const MOCK_INTERNAL_PAGE_REQUEST = new Request(mockFaker.internet.url());

export const mockInternalPageRouteContext = (): TInternalPageRouteContext => ({
  params: Promise.resolve({ id: MOCK_INTERNAL_PAGE_ID }),
});
