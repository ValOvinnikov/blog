import { STARTER_DOCUMENT_IDS } from '@shinefold/config';
import { LOCALE_ISO_CODES } from '@shinefold/config/constants';
import { mockSanityDocument } from '@worker/testing/sample-content/fixtures';

import { listKeptSamples } from './kept-samples';

const ids = STARTER_DOCUMENT_IDS;
const locale = LOCALE_ISO_CODES.NL;

const MOCK_TITLE = 'Welkom';
const MOCK_OTHER_LOCALE_TITLE = 'Welcome';

function localizedTitle(entries: Partial<Record<string, string>>) {
  return Object.entries(entries).map(([language, value]) => ({
    _key: language,
    language,
    value,
  }));
}

describe(listKeptSamples, () => {
  it('names each kept sample by id, type and title, in id order', () => {
    const post = mockSanityDocument(ids.BLOG_WELCOME_POST, {
      title: MOCK_TITLE,
    });
    const cta = mockSanityDocument(ids.BLOG_CTA, { title: MOCK_TITLE });
    const removed = mockSanityDocument(ids.BLOG_HERO);

    expect(
      listKeptSamples(
        [post, removed, cta],
        new Set([ids.BLOG_WELCOME_POST, ids.BLOG_CTA]),
        locale,
      ),
    ).toEqual([
      { id: ids.BLOG_CTA, type: cta._type, title: MOCK_TITLE },
      { id: ids.BLOG_WELCOME_POST, type: post._type, title: MOCK_TITLE },
    ]);
  });

  it("takes a localised title in the site's default language", () => {
    const topic = mockSanityDocument(ids.BLOG_TOPIC, {
      title: localizedTitle({
        [LOCALE_ISO_CODES.EN]: MOCK_OTHER_LOCALE_TITLE,
        [locale]: MOCK_TITLE,
      }),
    });

    expect(listKeptSamples([topic], new Set([ids.BLOG_TOPIC]), locale)).toEqual(
      [{ id: ids.BLOG_TOPIC, type: topic._type, title: MOCK_TITLE }],
    );
  });

  it('names an author by its name', () => {
    const author = mockSanityDocument(ids.BLOG_AUTHOR, { name: MOCK_TITLE });

    expect(
      listKeptSamples([author], new Set([ids.BLOG_AUTHOR]), locale),
    ).toEqual([{ id: ids.BLOG_AUTHOR, type: author._type, title: MOCK_TITLE }]);
  });

  it.each([
    ['neither a title nor a name', {}],
    ['an empty title', { title: '' }],
    [
      'a title only in another language',
      {
        title: localizedTitle({
          [LOCALE_ISO_CODES.EN]: MOCK_OTHER_LOCALE_TITLE,
        }),
      },
    ],
  ])('names a sample with %s by id and type alone', (_label, fields) => {
    const author = mockSanityDocument(ids.BLOG_AUTHOR, fields);

    expect(
      listKeptSamples([author], new Set([ids.BLOG_AUTHOR]), locale),
    ).toEqual([{ id: ids.BLOG_AUTHOR, type: author._type }]);
  });
});
