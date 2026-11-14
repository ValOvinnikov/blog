import type { TTenantPageLists } from '@web/server/tenant/tenant-page-lists/tenant-page-lists';

export const mockTenantPageLists = (
  overrides: Partial<TTenantPageLists> = {},
): TTenantPageLists => ({
  posts: [],
  topics: [],
  tags: [],
  topicPages: [],
  tagPages: [],
  blogPages: [],
  landingPages: [],
  privacyDocuments: [],
  legalDocuments: [],
  ...overrides,
});
