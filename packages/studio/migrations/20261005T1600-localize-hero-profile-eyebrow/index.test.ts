import { mockEnglishString } from '@blog/studio/testing/migrations/localized';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { localizeHeroProfileEyebrow } from './index';

faker.seed(16);

const MOCK_EYEBROW = faker.lorem.word();

describe(localizeHeroProfileEyebrow, () => {
  it('moves the eyebrow into the default language', () => {
    expect(localizeHeroProfileEyebrow({ eyebrow: MOCK_EYEBROW })).toEqual([
      at('eyebrow', set(mockEnglishString(MOCK_EYEBROW))),
    ]);
  });

  it.each([
    {
      name: 'an already localized eyebrow',
      doc: { eyebrow: mockEnglishString(MOCK_EYEBROW) },
    },
    { name: 'a hero without an eyebrow', doc: {} },
  ])('leaves $name alone', ({ doc }) => {
    expect(localizeHeroProfileEyebrow(doc)).toBeUndefined();
  });
});
