import { faker } from '@faker-js/faker';

import { buildPersonFields } from './build-person-fields';

faker.seed(8350);

const MOCK_AUTHOR_ID = faker.string.uuid();
const MOCK_PERSON_ID = faker.string.uuid();
const MOCK_PROFILE_PAGE = { _type: 'reference', _ref: faker.string.uuid() };
const MOCK_NAME = faker.person.fullName();

describe(buildPersonFields, () => {
  it('carries every blog_author field across unchanged', () => {
    const fields = {
      name: MOCK_NAME,
      image: { _type: 'imageWithAlt', alt: faker.lorem.words(2) },
      bio: [{ _type: 'block' }],
      role: faker.person.jobTitle(),
      socialLinks: [{ _type: 'socialProfile', url: faker.internet.url() }],
      profilePage: MOCK_PROFILE_PAGE,
    };

    const result = buildPersonFields(
      { _id: MOCK_AUTHOR_ID, ...fields },
      new Map(),
    );

    expect(result).toEqual(fields);
  });

  it('leaves a reference outside the author id map untouched', () => {
    const result = buildPersonFields(
      { _id: MOCK_AUTHOR_ID, name: MOCK_NAME, profilePage: MOCK_PROFILE_PAGE },
      new Map([[MOCK_AUTHOR_ID, MOCK_PERSON_ID]]),
    );

    expect(result.profilePage).toEqual(MOCK_PROFILE_PAGE);
  });
});
