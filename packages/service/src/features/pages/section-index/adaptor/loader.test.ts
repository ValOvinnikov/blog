import { SANITY_CONTENT_REVALIDATE_SECONDS } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { mockRun } from '@blog/service/testing/mock-run-query';
import {
  mockContentSlotView,
  mockCtaSlotView,
  mockHeroSlotView,
  mockRawCtaRef,
  mockRawSectionIndexPage,
} from '@blog/service/testing/pages/fixtures';
import {
  MOCK_PAGE_LEGAL_INDEX_CACHE_TAG,
  MOCK_PAGE_PRIVACY_INDEX_CACHE_TAG,
  MOCK_TEMPLATE_LEGAL_INDEX_CACHE_TAG,
  MOCK_TEMPLATE_PRIVACY_INDEX_CACHE_TAG,
} from '@blog/service/testing/sanity/query/cache-tags';
import { mockTenant } from '@blog/service/testing/tenant';
import { faker } from '@faker-js/faker';

import { getSectionIndexPageDocument } from './loader';

vi.mock('@blog/service/sanity/query/query');

faker.seed(65152);

const tenant = mockTenant();
const MOCK_PAGE_ID = faker.string.uuid();

describe(getSectionIndexPageDocument, () => {
  it('maps the hub to its id, hero, modules in order and languages', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawSectionIndexPage({
        _id: MOCK_PAGE_ID,
        translations: [{ language: null }, { language: LOCALE_ISO_CODES.NL }],
      }),
    );

    const page = await getSectionIndexPageDocument('page_privacyIndex', tenant);

    expect(page).toMatchObject({
      id: MOCK_PAGE_ID,
      hero: mockHeroSlotView(),
      modules: [mockContentSlotView(), mockCtaSlotView()],
      translations: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
    });
  });

  it('rejects a hero that is not a hero module', async () => {
    mockRun.mockResolvedValueOnce(
      mockRawSectionIndexPage({ hero: mockRawCtaRef() as never }),
    );

    await expect(
      getSectionIndexPageDocument('page_legalIndex', tenant),
    ).rejects.toThrow();
  });

  it('resolves undefined when the hub does not exist', async () => {
    mockRun.mockResolvedValueOnce(null);

    expect(
      await getSectionIndexPageDocument('page_legalIndex', tenant),
    ).toBeUndefined();
  });

  it.each([
    [
      'page_privacyIndex' as const,
      MOCK_PAGE_PRIVACY_INDEX_CACHE_TAG,
      MOCK_TEMPLATE_PRIVACY_INDEX_CACHE_TAG,
    ],
    [
      'page_legalIndex' as const,
      MOCK_PAGE_LEGAL_INDEX_CACHE_TAG,
      MOCK_TEMPLATE_LEGAL_INDEX_CACHE_TAG,
    ],
  ])(
    'tags the %s query with its page and template',
    async (type, pageTag, templateTag) => {
      mockRun.mockResolvedValueOnce(null);

      await getSectionIndexPageDocument(type, tenant);

      expect(mockRun).toHaveBeenCalledExactlyOnceWith(expect.anything(), {
        tenant,
        next: {
          revalidate: SANITY_CONTENT_REVALIDATE_SECONDS,
          tags: [pageTag, templateTag],
        },
      });
    },
  );
});
