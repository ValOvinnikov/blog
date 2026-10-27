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

import { localizeCtaModule } from './index';

faker.seed(2);

const LISTED_TEXT_TYPE = 'internationalizedArrayListedTextValue';
const MOCK_HEADING = faker.lorem.words(2);
const MOCK_SUPPORTING_TEXT = faker.lorem.sentence();
const MOCK_EYEBROW = faker.lorem.word();
const MOCK_FOOTNOTE = faker.lorem.sentence();
const MOCK_ALT = faker.lorem.words(3);
const MOCK_ASSET = mockImageAsset();
const MOCK_CONTENT = mockParagraph();

describe(localizeCtaModule, () => {
  it('moves the heading block into the default language', () => {
    expect(
      localizeCtaModule({
        headingBlock: mockPlainHeadingBlock(MOCK_HEADING, MOCK_SUPPORTING_TEXT),
      }),
    ).toEqual([
      at(
        'headingBlock',
        set(mockLocalizedHeadingBlock(MOCK_HEADING, MOCK_SUPPORTING_TEXT)),
      ),
    ]);
  });

  it('moves the eyebrow, content and footnote into the default language', () => {
    expect(
      localizeCtaModule({
        eyebrow: MOCK_EYEBROW,
        content: MOCK_CONTENT,
        footnote: MOCK_FOOTNOTE,
      }),
    ).toEqual([
      at('eyebrow', set(mockEnglishString(MOCK_EYEBROW))),
      at('content', set(mockInEnglish(LISTED_TEXT_TYPE, MOCK_CONTENT))),
      at('footnote', set(mockEnglishString(MOCK_FOOTNOTE))),
    ]);
  });

  it('keeps the image and moves its alt text into the default language', () => {
    expect(
      localizeCtaModule({ image: mockPlainImage(MOCK_ASSET, MOCK_ALT) }),
    ).toEqual([at('image', set(mockLocalizedImage(MOCK_ASSET, MOCK_ALT)))]);
  });

  it.each([
    {
      name: 'an already localized CTA',
      doc: {
        headingBlock: mockLocalizedHeadingBlock(MOCK_HEADING),
        eyebrow: mockEnglishString(MOCK_EYEBROW),
        content: mockInEnglish(LISTED_TEXT_TYPE, MOCK_CONTENT),
        footnote: mockEnglishString(MOCK_FOOTNOTE),
        image: mockLocalizedImage(MOCK_ASSET, MOCK_ALT),
      },
    },
    { name: 'a CTA without text', doc: {} },
  ])('leaves $name alone', ({ doc }) => {
    expect(localizeCtaModule(doc)).toBeUndefined();
  });
});
