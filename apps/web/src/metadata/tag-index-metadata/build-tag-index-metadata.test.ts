import { faker } from '@faker-js/faker';
import {
  LOCALE_ISO_CODES,
  routes,
  type TLocaleIsoCode,
} from '@shinefold/config';
import { okResult } from '@shinefold/utils';
import { TAG_INDEX_LOG } from '@web/constants/tag-index';
import { getRequestContext } from '@web/server/request-context/request-context';
import { NL_TAGS_INDEX_PATH } from '@web/testing/metadata/index-paths/fixtures';
import { testMetadataLoaderFailures } from '@web/testing/metadata/metadata-loader-contract/metadata-loader-contract';
import {
  MOCK_DUTCH_REQUEST_CONTEXT,
  mockMetadataSeo,
} from '@web/testing/metadata/to-metadata/fixtures';
import { mockIndexPage } from '@web/testing/pages/index-page/fixtures';

import { buildTagIndexMetadata } from './build-tag-index-metadata';

const { getTagIndexPageMock } = vi.hoisted(() => ({
  getTagIndexPageMock: vi.fn(),
}));

vi.mock('@web/server/tag-index/get-tag-index-page/get-tag-index-page', () => ({
  getTagIndexPage: getTagIndexPageMock,
}));

vi.mock('@web/server/request-context/request-context');

faker.seed(5206);

const { EN, NL, DE } = LOCALE_ISO_CODES;
const INDEX_PATH = routes.tags();

const MOCK_SEO = mockMetadataSeo();

const resolveIndexPageWith = (translations: TLocaleIsoCode[] = [EN]) =>
  getTagIndexPageMock.mockResolvedValue(
    okResult(mockIndexPage({ seo: MOCK_SEO, translations })),
  );

describe(buildTagIndexMetadata, () => {
  beforeEach(() => {
    resolveIndexPageWith();
  });

  it('reads the index page the tag index renders', async () => {
    await buildTagIndexMetadata();

    expect(getTagIndexPageMock).toHaveBeenCalledWith();
  });

  it('builds metadata from the resolved seo, self-canonical to the tag index', async () => {
    const metadata = await buildTagIndexMetadata();

    expect(metadata.title).toBe(MOCK_SEO.title);
    expect(metadata.alternates?.canonical).toBe(INDEX_PATH);
  });

  testMetadataLoaderFailures({
    pageLoaderMock: getTagIndexPageMock,
    buildMetadata: buildTagIndexMetadata,
    logEvent: TAG_INDEX_LOG.METADATA_FETCH_FAILED,
  });

  it('lists each live translated language as hreflang, canonical to its prefix', async () => {
    vi.mocked(getRequestContext).mockResolvedValue(MOCK_DUTCH_REQUEST_CONTEXT);
    resolveIndexPageWith([EN, NL, DE]);

    const metadata = await buildTagIndexMetadata();

    expect(metadata.alternates).toEqual({
      canonical: NL_TAGS_INDEX_PATH,
      languages: {
        en: INDEX_PATH,
        nl: NL_TAGS_INDEX_PATH,
        'x-default': INDEX_PATH,
      },
    });
  });
});
