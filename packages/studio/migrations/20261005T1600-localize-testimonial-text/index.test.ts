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

import { localizeTestimonialDocument } from './index';

faker.seed(17);

const LISTED_TEXT_TYPE = 'internationalizedArrayListedTextValue';
const MOCK_QUOTE = mockParagraph();
const MOCK_ROLE = faker.person.jobTitle();
const MOCK_ALT = faker.lorem.words(3);
const MOCK_HEADING = faker.lorem.words(3);
const MOCK_ASSET = mockImageAsset();

describe(localizeTestimonialDocument, () => {
  it("moves a testimonial's quote, role and photo alt into the default language", () => {
    expect(
      localizeTestimonialDocument({
        _type: 'block_testimonial',
        quote: MOCK_QUOTE,
        role: MOCK_ROLE,
        image: mockPlainImage(MOCK_ASSET, MOCK_ALT),
      }),
    ).toEqual([
      at('quote', set(mockInEnglish(LISTED_TEXT_TYPE, MOCK_QUOTE))),
      at('role', set(mockEnglishString(MOCK_ROLE))),
      at('image', set(mockLocalizedImage(MOCK_ASSET, MOCK_ALT))),
    ]);
  });

  it('moves a Testimonials module heading block into the default language', () => {
    expect(
      localizeTestimonialDocument({
        _type: 'module_testimonial',
        headingBlock: mockPlainHeadingBlock(MOCK_HEADING),
      }),
    ).toEqual([
      at('headingBlock', set(mockLocalizedHeadingBlock(MOCK_HEADING))),
    ]);
  });

  it('localizes only the fields still holding plain values', () => {
    expect(
      localizeTestimonialDocument({
        _type: 'block_testimonial',
        quote: mockInEnglish(LISTED_TEXT_TYPE, MOCK_QUOTE),
        role: MOCK_ROLE,
      }),
    ).toEqual([at('role', set(mockEnglishString(MOCK_ROLE)))]);
  });

  it.each([
    {
      name: 'an already localized testimonial',
      doc: {
        _type: 'block_testimonial' as const,
        quote: mockInEnglish(LISTED_TEXT_TYPE, MOCK_QUOTE),
        role: mockEnglishString(MOCK_ROLE),
        image: mockLocalizedImage(MOCK_ASSET, MOCK_ALT),
      },
    },
    {
      name: 'an already localized Testimonials module',
      doc: {
        _type: 'module_testimonial' as const,
        headingBlock: mockLocalizedHeadingBlock(MOCK_HEADING),
      },
    },
    {
      name: 'a testimonial without text',
      doc: { _type: 'block_testimonial' as const },
    },
    {
      name: 'a Testimonials module without text',
      doc: { _type: 'module_testimonial' as const },
    },
  ])('leaves $name alone', ({ doc }) => {
    expect(localizeTestimonialDocument(doc)).toBeUndefined();
  });
});
