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
import { faker } from '@faker-js/faker';

import { personCardFragment, personDetailFragment } from './person';

faker.seed(6018);

const { EN, NL, FR } = LOCALE_ISO_CODES;

const MOCK_PERSON_ID = faker.string.uuid();
const MOCK_ENGLISH_ALT = faker.lorem.sentence();
const MOCK_DUTCH_ALT = faker.lorem.sentence();
const MOCK_ENGLISH_ROLE = faker.person.jobTitle();
const MOCK_DUTCH_ROLE = faker.person.jobTitle();
const MOCK_ENGLISH_BIO = faker.lorem.sentence();
const MOCK_DUTCH_BIO = faker.lorem.sentence();

const authorCardDocQuery = q.star
  .filterByType('person')
  .slice(0)
  .project(personCardFragment);

const authorDetailDocQuery = q.star
  .filterByType('person')
  .slice(0)
  .project(personDetailFragment);

const rawCard = mockRawPersonCard();
const rawDetail = mockRawAuthor({ image: null, role: null });

describe('personCardFragment', () => {
  it.each([
    { state: 'missing', image: null },
    { state: 'present', image: mockRawSanityImage() },
  ])('keeps the author image when it is $state', ({ image }) => {
    const author = authorCardDocQuery.parse({ ...rawCard, image });

    expect(author?.image).toEqual(image);
  });

  it('keeps the profile page link through a real parse', () => {
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

    expect(author).toEqual(rawDetail);
  });

  it('keeps a bio link mark through a real parse', () => {
    const markDef = mockRawPortableTextMarkDef();

    const author = authorDetailDocQuery.parse({
      ...rawDetail,
      bio: [{ _type: 'block', _key: MOCK_BIO_BLOCK_KEY, markDefs: [markDef] }],
    });

    const [bioBlock] = author?.bio ?? [];
    expect(bioBlock?.markDefs).toEqual([markDef]);
  });

  it('keeps the social links through a real parse', () => {
    const socialProfile = mockRawSocialProfile();

    const author = authorDetailDocQuery.parse({
      ...rawDetail,
      socialLinks: [socialProfile],
    });

    expect(author?.socialLinks).toEqual([socialProfile]);
  });

  describe('per language', () => {
    const personDocument = {
      _id: MOCK_PERSON_ID,
      _type: 'person',
      name: rawCard.name,
      image: mockLocalizedImage({
        [EN]: MOCK_ENGLISH_ALT,
        [NL]: MOCK_DUTCH_ALT,
      }),
      role: mockLocalizedStrings({
        [EN]: MOCK_ENGLISH_ROLE,
        [NL]: MOCK_DUTCH_ROLE,
      }),
      bio: mockLocalizedParagraphText({
        [EN]: MOCK_ENGLISH_BIO,
        [NL]: MOCK_DUTCH_BIO,
      }),
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

    it.each([
      {
        behaviour: 'picks the role, bio and photo alt in the visitor language',
        locale: NL,
        expected: {
          role: MOCK_DUTCH_ROLE,
          bio: MOCK_DUTCH_BIO,
          alt: MOCK_DUTCH_ALT,
        },
      },
      {
        behaviour:
          'falls back to the default language for the role, bio and alt',
        locale: FR,
        expected: {
          role: MOCK_ENGLISH_ROLE,
          bio: MOCK_ENGLISH_BIO,
          alt: MOCK_ENGLISH_ALT,
        },
      },
    ])('$behaviour', async ({ locale, expected }) => {
      const person = await runPerson(locale);

      const [bioBlock] = person?.bio ?? [];
      const [bioSpan] = bioBlock?.children ?? [];

      expect(person?.name).toBe(rawCard.name);
      expect(person?.role).toBe(expected.role);
      expect(bioSpan?.text).toBe(expected.bio);
      expect(person?.image?.alt).toBe(expected.alt);
    });
  });
});
