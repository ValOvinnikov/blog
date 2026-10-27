import { mockEnglishString } from '@blog/studio/testing/migrations/localized';
import { faker } from '@faker-js/faker';
import { at, set } from 'sanity/migrate';

import { localizeLinkDocument } from './index';

faker.seed(1);

const MOCK_LABEL = faker.lorem.words(2);
const MOCK_URL = faker.internet.url();

describe(localizeLinkDocument, () => {
  it('moves a plain label into the default language', () => {
    expect(localizeLinkDocument({ label: MOCK_LABEL })).toEqual([
      at('label', set(mockEnglishString(MOCK_LABEL))),
    ]);
  });

  it('moves a plain url into the default language alongside the label', () => {
    expect(localizeLinkDocument({ label: MOCK_LABEL, url: MOCK_URL })).toEqual([
      at('label', set(mockEnglishString(MOCK_LABEL))),
      at('url', set(mockEnglishString(MOCK_URL))),
    ]);
  });

  it.each([
    {
      name: 'an already localized link',
      doc: {
        label: mockEnglishString(MOCK_LABEL),
        url: mockEnglishString(MOCK_URL),
      },
    },
    { name: 'a link without a label or url', doc: {} },
  ])('leaves $name alone', ({ doc }) => {
    expect(localizeLinkDocument(doc)).toBeUndefined();
  });
});
