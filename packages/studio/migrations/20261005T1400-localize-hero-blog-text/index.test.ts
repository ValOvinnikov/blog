import {
  mockImageAsset,
  mockLocalizedImage,
  mockPlainImage,
} from '@blog/studio/testing/migrations/localize';
import { mockEnglishString } from '@blog/studio/testing/migrations/localized';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { localizeHeroBlogModule } from './index';

faker.seed(15);

const MOCK_EYEBROW = faker.lorem.word();
const MOCK_ACTION_LABEL = faker.lorem.words(3);
const MOCK_ALT = faker.lorem.words(2);
const MOCK_ASSET = mockImageAsset();

describe(localizeHeroBlogModule, () => {
  it('moves the eyebrow, action label and image alt into the default language', () => {
    expect(
      localizeHeroBlogModule({
        eyebrow: MOCK_EYEBROW,
        primaryActionLabel: MOCK_ACTION_LABEL,
        image: mockPlainImage(MOCK_ASSET, MOCK_ALT),
      }),
    ).toEqual([
      at('eyebrow', set(mockEnglishString(MOCK_EYEBROW))),
      at('primaryActionLabel', set(mockEnglishString(MOCK_ACTION_LABEL))),
      at('image', set(mockLocalizedImage(MOCK_ASSET, MOCK_ALT))),
    ]);
  });

  it.each([
    {
      name: 'an already localized hero',
      doc: {
        eyebrow: mockEnglishString(MOCK_EYEBROW),
        primaryActionLabel: mockEnglishString(MOCK_ACTION_LABEL),
        image: mockLocalizedImage(MOCK_ASSET, MOCK_ALT),
      },
    },
    { name: 'a hero without text', doc: {} },
  ])('leaves $name alone', ({ doc }) => {
    expect(localizeHeroBlogModule(doc)).toBeUndefined();
  });
});
