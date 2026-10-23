import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { q } from '@blog/service/sanity/query/query';
import {
  mockRawAuthor,
  mockRawPersonCard,
} from '@blog/service/testing/pages/fixtures';
import {
  MOCK_BIO_BLOCK_KEY,
  mockRawExternalLinkDocument,
  mockRawPortableTextMarkDef,
  mockRawSanityImage,
  mockRawSocialProfile,
} from '@blog/service/testing/shared/fixtures';
import { evaluateGroqExpression } from '@blog/service/testing/shared/groq';
import {
  MOCK_IMAGE_ASSET_DOCUMENT,
  mockLocalizedImage,
  mockLocalizedParagraphText,
  mockLocalizedStrings,
} from '@blog/service/testing/shared/localized';

import { personCardFragment, personDetailFragment } from './person';

const { EN, NL, FR } = LOCALE_ISO_CODES;

const ENGLISH_ALT = 'Jane smiling';
const DUTCH_ALT = 'Jane lacht';
const ENGLISH_BIO = 'Writes about design.';
const DUTCH_BIO = 'Schrijft over ontwerp.';

const authorCardDocQuery = q.star
  .filterByType('person')
  .slice(0)
  .project(personCardFragment);

const authorDetailDocQuery = q.star
  .filterByType('person')
  .slice(0)
  .project(personDetailFragment);

const rawCard = mockRawPersonCard();
const { name } = rawCard;
const rawDetail = mockRawAuthor({ image: null, role: null });

describe('personCardFragment', () => {
  it('leaves image null for an author with no image', () => {
    const author = authorCardDocQuery.parse(rawCard);

    expect(author?.image).toBeNull();
  });

  it('parses an author with an image present', () => {
    const image = mockRawSanityImage();

    const author = authorCardDocQuery.parse({ ...rawCard, image });

    expect(author?.image).toEqual(image);
  });

  it('parses a profilePage through the shared link document fragment', () => {
    const profileLink = mockRawExternalLinkDocument();

    const author = authorCardDocQuery.parse({
      ...rawCard,
      profilePage: profileLink,
    });

    expect(author?.profilePage).toEqual(profileLink);
  });
});

describe('personDetailFragment', () => {
  it('parses an author with every optional detail empty', () => {
    const author = authorDetailDocQuery.parse(rawDetail);

    expect(author?.image).toBeNull();
  });

  it('keeps a bio linkRef mark through a real parse', () => {
    const author = authorDetailDocQuery.parse({
      ...rawDetail,
      bio: [
        {
          _type: 'block',
          _key: MOCK_BIO_BLOCK_KEY,
          markDefs: [mockRawPortableTextMarkDef()],
        },
      ],
    });

    expect(author?.bio?.[0]).toMatchObject({
      markDefs: [{ link: { url: 'https://example.com' } }],
    });
  });

  it('parses socialLinks through the shared social profile fragment', () => {
    const socialProfile = mockRawSocialProfile();

    const author = authorDetailDocQuery.parse({
      ...rawDetail,
      socialLinks: [socialProfile],
    });

    expect(author?.socialLinks).toEqual([socialProfile]);
  });
});

describe('personDetailFragment per language', () => {
  const personDocument = {
    _id: 'person-1',
    _type: 'person',
    name,
    image: mockLocalizedImage({ [EN]: ENGLISH_ALT, [NL]: DUTCH_ALT }),
    role: mockLocalizedStrings({ [EN]: 'Founder', [NL]: 'Oprichter' }),
    bio: mockLocalizedParagraphText({ [EN]: ENGLISH_BIO, [NL]: DUTCH_BIO }),
  };

  async function runPerson(locale: string) {
    const raw = await evaluateGroqExpression(
      authorDetailDocQuery.query,
      [personDocument, MOCK_IMAGE_ASSET_DOCUMENT],
      undefined,
      { locale, defaultLocale: EN },
    );

    return authorDetailDocQuery.parse(raw);
  }

  it('picks the role, bio and photo alt in the visitor language', async () => {
    const person = await runPerson(NL);

    expect(person).toMatchObject({
      name,
      role: 'Oprichter',
      bio: [{ children: [{ text: DUTCH_BIO }] }],
      image: { alt: DUTCH_ALT },
    });
  });

  it('falls back to the default language for the role, bio and photo alt', async () => {
    const person = await runPerson(FR);

    expect(person).toMatchObject({
      name,
      role: 'Founder',
      bio: [{ children: [{ text: ENGLISH_BIO }] }],
      image: { alt: ENGLISH_ALT },
    });
  });
});
