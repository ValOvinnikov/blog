import {
  mockImageAsset,
  mockLocalizedHeadingBlock,
  mockLocalizedImage,
  mockPlainHeadingBlock,
  mockPlainImage,
} from '@blog/studio/testing/migrations/localize';
import {
  mockEnglishString,
  mockInEnglish,
  mockParagraph,
} from '@blog/studio/testing/migrations/localized';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { localizePersonTeamHeroProfile } from './index';

faker.seed(12);

const PARAGRAPH_TEXT_TYPE = 'internationalizedArrayParagraphTextValue';
const MOCK_ROLE = faker.person.jobTitle();
const MOCK_BIO = mockParagraph();
const MOCK_PERSON_ALT = faker.lorem.words(3);
const MOCK_PROFILE_ALT = faker.lorem.words(3);
const MOCK_TEAM_HEADING = faker.lorem.words(2);
const MOCK_PROFILE_HEADING = faker.lorem.words(2);
const MOCK_ASSET = mockImageAsset();

describe(localizePersonTeamHeroProfile, () => {
  it("moves a person's role, bio and photo alt into the default language", () => {
    expect(
      localizePersonTeamHeroProfile({
        _type: 'person',
        role: MOCK_ROLE,
        bio: MOCK_BIO,
        image: mockPlainImage(MOCK_ASSET, MOCK_PERSON_ALT),
      }),
    ).toEqual([
      at('role', set(mockEnglishString(MOCK_ROLE))),
      at('bio', set(mockInEnglish(PARAGRAPH_TEXT_TYPE, MOCK_BIO))),
      at('image', set(mockLocalizedImage(MOCK_ASSET, MOCK_PERSON_ALT))),
    ]);
  });

  it("moves a Team module's heading block into the default language", () => {
    expect(
      localizePersonTeamHeroProfile({
        _type: 'module_team',
        headingBlock: mockPlainHeadingBlock(MOCK_TEAM_HEADING),
      }),
    ).toEqual([
      at('headingBlock', set(mockLocalizedHeadingBlock(MOCK_TEAM_HEADING))),
    ]);
  });

  it("moves a Profile Hero's heading block and image alt into the default language", () => {
    expect(
      localizePersonTeamHeroProfile({
        _type: 'module_heroProfile',
        headingBlock: mockPlainHeadingBlock(MOCK_PROFILE_HEADING),
        image: mockPlainImage(MOCK_ASSET, MOCK_PROFILE_ALT),
      }),
    ).toEqual([
      at('headingBlock', set(mockLocalizedHeadingBlock(MOCK_PROFILE_HEADING))),
      at('image', set(mockLocalizedImage(MOCK_ASSET, MOCK_PROFILE_ALT))),
    ]);
  });

  it.each([
    {
      name: 'an already localized person',
      doc: {
        _type: 'person' as const,
        role: mockEnglishString(MOCK_ROLE),
        bio: mockInEnglish(PARAGRAPH_TEXT_TYPE, MOCK_BIO),
        image: mockLocalizedImage(MOCK_ASSET, MOCK_PERSON_ALT),
      },
    },
    {
      name: 'an already localized Profile Hero',
      doc: {
        _type: 'module_heroProfile' as const,
        headingBlock: mockLocalizedHeadingBlock(MOCK_PROFILE_HEADING),
      },
    },
    {
      name: 'a person without role, bio or photo',
      doc: { _type: 'person' as const },
    },
  ])('leaves $name alone', ({ doc }) => {
    expect(localizePersonTeamHeroProfile(doc)).toBeUndefined();
  });
});
