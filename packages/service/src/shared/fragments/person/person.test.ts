import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query';
import {
  makeRawExternalLinkDocument,
  makeRawPortableTextMarkDef,
  makeRawSanityImage,
} from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  localizedStrings,
  localizedValues,
  paragraphBlocks,
} from '@blog/service/testing/shared/localized';

import { personCardFragment, personDetailFragment } from './person';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const authorCardDocQuery = q.star
  .filterByType('person')
  .slice(0)
  .project(personCardFragment);

const authorDetailDocQuery = q.star
  .filterByType('person')
  .slice(0)
  .project(personDetailFragment);

describe('personCardFragment', () => {
  it('parses an author with no image, leaving image null', () => {
    const raw = {
      _id: 'author-1',
      name: 'Jane Doe',
      image: null,
      profilePage: null,
    };

    expect(() => authorCardDocQuery.parse(raw)).not.toThrow();
    expect(authorCardDocQuery.parse(raw)?.image).toBeNull();
  });

  it('parses an author with an image present', () => {
    const raw = {
      _id: 'author-1',
      name: 'Jane Doe',
      image: makeRawSanityImage('Jane avatar'),
      profilePage: null,
    };

    expect(authorCardDocQuery.parse(raw)?.image).toEqual(
      makeRawSanityImage('Jane avatar'),
    );
  });

  it('parses a profilePage through the shared link document fragment', () => {
    const raw = {
      _id: 'author-1',
      name: 'Jane Doe',
      image: null,
      profilePage: makeRawExternalLinkDocument({
        url: 'https://example.com/jane',
      }),
    };

    expect(authorCardDocQuery.parse(raw)?.profilePage).toEqual(
      makeRawExternalLinkDocument({ url: 'https://example.com/jane' }),
    );
  });
});

describe('personDetailFragment', () => {
  it('parses an author with no image, leaving image null', () => {
    const raw = {
      _id: 'author-1',
      name: 'Jane Doe',
      image: null,
      profilePage: null,
      role: null,
      bio: null,
      socialLinks: null,
    };

    expect(() => authorDetailDocQuery.parse(raw)).not.toThrow();
    expect(authorDetailDocQuery.parse(raw)?.image).toBeNull();
  });

  it('keeps a bio linkRef mark through a real parse', () => {
    const raw = {
      _id: 'author-1',
      name: 'Jane Doe',
      image: null,
      profilePage: null,
      role: null,
      bio: [
        {
          _type: 'block',
          _key: 'bio-block-1',
          markDefs: [makeRawPortableTextMarkDef()],
        },
      ],
      socialLinks: null,
    };

    expect(() => authorDetailDocQuery.parse(raw)).not.toThrow();
    expect(authorDetailDocQuery.parse(raw)?.bio?.[0]).toMatchObject({
      markDefs: [{ link: { url: 'https://example.com' } }],
    });
  });

  it('parses socialLinks through the shared social profile fragment', () => {
    const raw = {
      _id: 'author-1',
      name: 'Jane Doe',
      image: null,
      profilePage: null,
      role: null,
      bio: null,
      socialLinks: [
        {
          platform: 'GITHUB',
          link: makeRawExternalLinkDocument({
            url: 'https://github.com/janedoe',
          }),
        },
      ],
    };

    expect(() => authorDetailDocQuery.parse(raw)).not.toThrow();
    expect(authorDetailDocQuery.parse(raw)?.socialLinks).toEqual([
      {
        platform: 'GITHUB',
        link: makeRawExternalLinkDocument({
          url: 'https://github.com/janedoe',
        }),
      },
    ]);
  });
});

describe('personDetailFragment per language', () => {
  const personDocument = {
    _id: 'person-1',
    _type: 'person',
    name: 'Jane Doe',
    image: {
      _type: 'localizedImageWithAlt',
      asset: { _type: 'reference', _ref: 'image-1' },
      alt: localizedStrings({ [EN]: 'Jane smiling', [NL]: 'Jane lacht' }),
    },
    role: localizedStrings({ [EN]: 'Founder', [NL]: 'Oprichter' }),
    bio: localizedValues('internationalizedArrayParagraphTextValue', {
      [EN]: paragraphBlocks('Writes about design.'),
      [NL]: paragraphBlocks('Schrijft over ontwerp.'),
    }),
  };

  const imageAsset = { _id: 'image-1', _type: 'sanity.imageAsset' };

  async function runPerson(locale: string) {
    const raw = await evaluateGroqExpression(
      authorDetailDocQuery.query,
      [personDocument, imageAsset],
      undefined,
      { locale, defaultLocale: EN },
    );

    return authorDetailDocQuery.parse(raw);
  }

  it('picks the role, bio and photo alt in the visitor language', async () => {
    expect(await runPerson(NL)).toMatchObject({
      name: 'Jane Doe',
      role: 'Oprichter',
      bio: [{ children: [{ text: 'Schrijft over ontwerp.' }] }],
      image: { alt: 'Jane lacht' },
    });
  });

  it('falls back to the default language for the role, bio and photo alt', async () => {
    expect(await runPerson(FR)).toMatchObject({
      name: 'Jane Doe',
      role: 'Founder',
      bio: [{ children: [{ text: 'Writes about design.' }] }],
      image: { alt: 'Jane smiling' },
    });
  });
});
