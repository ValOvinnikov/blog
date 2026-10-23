import { LOCALE_ISO_CODES, POST_SOURCE } from '@blog/config/constants';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { setLiveLanguages } from '@blog/studio/schema-types/validation/live-languages/live-languages';
import { validatePinnedPostTranslated } from '@blog/studio/schema-types/validation/validate-pinned-post-translated/validate-pinned-post-translated';
import { mockTranslationMetadata } from '@blog/studio/testing/mock-documents';
import { mockGroqValidationContext } from '@blog/studio/testing/mock-validation-context';
import type { ValidationContext } from 'sanity';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const MISSING_DUTCH_WARNING =
  "The pinned post has no Dutch version, so this hero won't show on Dutch pages.";
const PUBLISHED_AT = '2020-01-01T00:00:00Z';
const SCHEDULED_AT = '2999-01-01T00:00:00Z';

const post = (_id: string, language: string, publishedAt = PUBLISHED_AT) => ({
  _id,
  _type: PAGE_POST_TYPE,
  language,
  publishedAt,
});

const pinned = { _ref: 'post-en' };

const contextWith = (
  dataset: unknown[],
  {
    postSource = POST_SOURCE.PINNED,
    fetchError,
  }: { postSource?: string; fetchError?: Error } = {},
) => mockGroqValidationContext(dataset, { parent: { postSource }, fetchError });

describe(validatePinnedPostTranslated, () => {
  let englishPost: ReturnType<typeof post>;
  let postGroup: ReturnType<typeof mockTranslationMetadata>;
  let englishOnlyContext: ValidationContext;

  beforeEach(() => {
    setLiveLanguages([EN, NL]);
    englishPost = post('post-en', EN);
    postGroup = mockTranslationMetadata([
      ['post-en', EN],
      ['post-nl', NL],
    ]);
    englishOnlyContext = contextWith([englishPost]);
  });

  afterEach(() => {
    setLiveLanguages([]);
  });

  it('warns naming Dutch when an English-only post is pinned and Dutch is live', async () => {
    await expect(
      validatePinnedPostTranslated(pinned, englishOnlyContext),
    ).resolves.toBe(MISSING_DUTCH_WARNING);
  });

  it('passes when the pinned post is translated into every live language', async () => {
    await expect(
      validatePinnedPostTranslated(
        pinned,
        contextWith([englishPost, post('post-nl', NL), postGroup]),
      ),
    ).resolves.toBe(true);
  });

  it('does not count a translation that is not published yet', async () => {
    await expect(
      validatePinnedPostTranslated(
        pinned,
        contextWith([
          englishPost,
          post('post-nl', NL, SCHEDULED_AT),
          postGroup,
        ]),
      ),
    ).resolves.toBe(MISSING_DUTCH_WARNING);
  });

  it('names every missing live language', async () => {
    setLiveLanguages([EN, NL, FR]);

    await expect(
      validatePinnedPostTranslated(pinned, englishOnlyContext),
    ).resolves.toBe(
      "The pinned post has no Dutch or French version, so this hero won't show on Dutch or French pages.",
    );
  });

  it('ignores languages that are not live', async () => {
    setLiveLanguages([EN]);

    await expect(
      validatePinnedPostTranslated(pinned, englishOnlyContext),
    ).resolves.toBe(true);
  });

  it('passes when the source is Newest featured', async () => {
    await expect(
      validatePinnedPostTranslated(
        pinned,
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
        pinned,
        contextWith([], { fetchError: new Error('network down') }),
      ),
    ).resolves.toBe(true);
  });
});
