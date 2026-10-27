import { LOCALE_ISO_CODES, POST_SOURCE } from '@blog/config/constants';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { setLiveLanguages } from '@blog/studio/schema-types/validation/live-languages/live-languages';
import { validatePinnedPostTranslated } from '@blog/studio/schema-types/validation/validate-pinned-post-translated/validate-pinned-post-translated';
import {
  mockReference,
  mockTranslationMetadata,
} from '@blog/studio/testing/mock-documents';
import { MOCK_FETCH_ERROR } from '@blog/studio/testing/mock-fetch-error';
import { mockGroqValidationContext } from '@blog/studio/testing/mock-validation-context';
import { faker } from '@faker-js/faker';

faker.seed(6022);

const { EN, NL, FR } = LOCALE_ISO_CODES;

const MISSING_DUTCH_WARNING =
  "The pinned post has no Dutch version, so this hero won't show on Dutch pages.";
const MISSING_DUTCH_AND_FRENCH_WARNING =
  "The pinned post has no Dutch or French version, so this hero won't show on Dutch or French pages.";

const MOCK_NOW = new Date('2026-01-01T00:00:00Z');
const MOCK_PUBLISHED_AT = faker.date.past({ refDate: MOCK_NOW }).toISOString();
const MOCK_SCHEDULED_AT = faker.date
  .future({ refDate: MOCK_NOW })
  .toISOString();
const MOCK_ENGLISH_POST_ID = faker.string.uuid();
const MOCK_DUTCH_POST_ID = faker.string.uuid();

const pinnedPost = mockReference(MOCK_ENGLISH_POST_ID);

const mockPost = (
  _id: string,
  language: string,
  publishedAt = MOCK_PUBLISHED_AT,
) => ({ _id, _type: PAGE_POST_TYPE, language, publishedAt });

const englishPost = mockPost(MOCK_ENGLISH_POST_ID, EN);
const postGroup = mockTranslationMetadata([
  [MOCK_ENGLISH_POST_ID, EN],
  [MOCK_DUTCH_POST_ID, NL],
]);

const contextWith = (
  dataset: unknown[],
  {
    postSource = POST_SOURCE.PINNED,
    fetchError,
  }: { postSource?: string; fetchError?: Error } = {},
) => mockGroqValidationContext(dataset, { parent: { postSource }, fetchError });

describe(validatePinnedPostTranslated, () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_NOW);
    setLiveLanguages([EN, NL]);
  });

  afterEach(() => {
    setLiveLanguages([]);
    vi.useRealTimers();
  });

  it.each([
    {
      case: 'warns naming the one missing live language',
      live: [EN, NL],
      expected: MISSING_DUTCH_WARNING,
    },
    {
      case: 'names every missing live language',
      live: [EN, NL, FR],
      expected: MISSING_DUTCH_AND_FRENCH_WARNING,
    },
    {
      case: 'ignores languages that are not live',
      live: [EN],
      expected: true,
    },
  ])('$case', async ({ live, expected }) => {
    setLiveLanguages(live);

    await expect(
      validatePinnedPostTranslated(pinnedPost, contextWith([englishPost])),
    ).resolves.toBe(expected);
  });

  it('passes when the pinned post is translated into every live language', async () => {
    const dutchPost = mockPost(MOCK_DUTCH_POST_ID, NL);

    await expect(
      validatePinnedPostTranslated(
        pinnedPost,
        contextWith([englishPost, dutchPost, postGroup]),
      ),
    ).resolves.toBe(true);
  });

  it('does not count a translation that is not published yet', async () => {
    const scheduledDutchPost = mockPost(
      MOCK_DUTCH_POST_ID,
      NL,
      MOCK_SCHEDULED_AT,
    );

    await expect(
      validatePinnedPostTranslated(
        pinnedPost,
        contextWith([englishPost, scheduledDutchPost, postGroup]),
      ),
    ).resolves.toBe(MISSING_DUTCH_WARNING);
  });

  it('passes when the source is Newest featured', async () => {
    await expect(
      validatePinnedPostTranslated(
        pinnedPost,
        contextWith([englishPost], {
          postSource: POST_SOURCE.NEWEST_FEATURED,
        }),
      ),
    ).resolves.toBe(true);
  });

  it('passes when no post is pinned', async () => {
    await expect(
      validatePinnedPostTranslated(undefined, contextWith([])),
    ).resolves.toBe(true);
  });

  it('passes when the fetch fails', async () => {
    await expect(
      validatePinnedPostTranslated(
        pinnedPost,
        contextWith([], { fetchError: MOCK_FETCH_ERROR }),
      ),
    ).resolves.toBe(true);
  });
});
