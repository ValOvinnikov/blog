import { LOCALE_ISO_CODES, POST_SOURCE } from '@blog/config/constants';
import { PAGE_POST_TYPE } from '@blog/studio/schema-types/documents/pages/post/post-type';
import { setLiveLanguages } from '@blog/studio/schema-types/validation/live-languages/live-languages';
import { validatePinnedPostTranslated } from '@blog/studio/schema-types/validation/validate-pinned-post-translated/validate-pinned-post-translated';
import { evaluate, parse } from 'groq-js';
import type { ValidationContext } from 'sanity';

const { EN, NL, FR } = LOCALE_ISO_CODES;
const PUBLISHED_AT = '2020-01-01T00:00:00Z';
const SCHEDULED_AT = '2999-01-01T00:00:00Z';

const post = (_id: string, language: string, publishedAt = PUBLISHED_AT) => ({
  _id,
  _type: PAGE_POST_TYPE,
  language,
  publishedAt,
});

const translationGroup = (...ids: string[]) => ({
  _id: `translation.metadata.${ids.join('-')}`,
  _type: 'translation.metadata',
  translations: ids.map((id) => ({ _key: id, value: { _ref: id } })),
});

const createContext = (
  dataset: Record<string, unknown>[],
  postSource: string = POST_SOURCE.PINNED,
  fetchError?: Error,
) => {
  const getClient = () => ({
    withConfig: () => ({
      fetch: async (query: string, params: Record<string, unknown>) => {
        if (fetchError) throw fetchError;
        const result = await evaluate(parse(query), { dataset, params });
        return result.get();
      },
    }),
  });

  return { parent: { postSource }, getClient } as unknown as ValidationContext;
};

const pinned = { _ref: 'post-en' };

describe(validatePinnedPostTranslated, () => {
  beforeEach(() => {
    setLiveLanguages([EN, NL]);
  });

  afterEach(() => {
    setLiveLanguages([]);
  });

  it('warns naming Dutch when an English-only post is pinned and Dutch is live', async () => {
    await expect(
      validatePinnedPostTranslated(
        pinned,
        createContext([post('post-en', EN)]),
      ),
    ).resolves.toBe(
      "The pinned post has no Dutch version, so this hero won't show on Dutch pages.",
    );
  });

  it('passes when the pinned post is translated into every live language', async () => {
    const dataset = [
      post('post-en', EN),
      post('post-nl', NL),
      translationGroup('post-en', 'post-nl'),
    ];

    await expect(
      validatePinnedPostTranslated(pinned, createContext(dataset)),
    ).resolves.toBe(true);
  });

  it('does not count a translation that is not published yet', async () => {
    const dataset = [
      post('post-en', EN),
      post('post-nl', NL, SCHEDULED_AT),
      translationGroup('post-en', 'post-nl'),
    ];

    await expect(
      validatePinnedPostTranslated(pinned, createContext(dataset)),
    ).resolves.toBe(
      "The pinned post has no Dutch version, so this hero won't show on Dutch pages.",
    );
  });

  it('names every missing live language', async () => {
    setLiveLanguages([EN, NL, FR]);

    await expect(
      validatePinnedPostTranslated(
        pinned,
        createContext([post('post-en', EN)]),
      ),
    ).resolves.toBe(
      "The pinned post has no Dutch or French version, so this hero won't show on Dutch or French pages.",
    );
  });

  it('ignores languages that are not live', async () => {
    setLiveLanguages([EN]);

    await expect(
      validatePinnedPostTranslated(
        pinned,
        createContext([post('post-en', EN)]),
      ),
    ).resolves.toBe(true);
  });

  it('passes when the source is Newest featured', async () => {
    await expect(
      validatePinnedPostTranslated(
        pinned,
        createContext([post('post-en', EN)], POST_SOURCE.NEWEST_FEATURED),
      ),
    ).resolves.toBe(true);
  });

  it('passes when no post is pinned', async () => {
    await expect(
      validatePinnedPostTranslated(undefined, createContext([])),
    ).resolves.toBe(true);
  });

  it('passes when the fetch fails', async () => {
    await expect(
      validatePinnedPostTranslated(
        pinned,
        createContext([], POST_SOURCE.PINNED, new Error('network down')),
      ),
    ).resolves.toBe(true);
  });
});
