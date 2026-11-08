import { routes, SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { LEGAL_PAGE_KIND } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  MOCK_PAGE_LEGAL_DOCUMENT_CACHE_TAG,
  MOCK_PAGE_PRIVACY_DOCUMENT_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getSectionDocumentByKind } from './loader';
import { sectionDocumentByKindQuery } from './query';

vi.mock('@blog/service/sanity/query/query');

faker.seed(6517);

const MOCK_SLUG = faker.lorem.slug();

const tenant = mockTenant();

describe(getSectionDocumentByKind, () => {
  it.each([
    ['page_privacyDocument', routes.privacyDocument(MOCK_SLUG)],
    ['page_legalDocument', routes.legalDocument(MOCK_SLUG)],
  ] as const)('links a %s to its section path', async (_type, href) => {
    mockRun.mockResolvedValueOnce({ _type, slug: MOCK_SLUG });

    const result = await getSectionDocumentByKind(
      LEGAL_PAGE_KIND.TERMS,
      tenant,
    );

    expect(result).toEqual({ href });
  });

  it('resolves undefined when no page has the kind', async () => {
    mockRun.mockResolvedValueOnce(null);

    const result = await getSectionDocumentByKind(
      LEGAL_PAGE_KIND.IMPRINT,
      tenant,
    );

    expect(result).toBeUndefined();
  });

  it('queries the kind for the tenant under both section tags', async () => {
    mockRun.mockResolvedValueOnce(null);

    await getSectionDocumentByKind(LEGAL_PAGE_KIND.PRIVACY_POLICY, tenant);

    expect(mockRun).toHaveBeenCalledWith(sectionDocumentByKindQuery, {
      parameters: { kind: LEGAL_PAGE_KIND.PRIVACY_POLICY },
      tenant,
      next: {
        revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
        tags: [
          MOCK_PAGE_PRIVACY_DOCUMENT_CACHE_TAG,
          MOCK_PAGE_LEGAL_DOCUMENT_CACHE_TAG,
        ],
      },
    });
  });
});
