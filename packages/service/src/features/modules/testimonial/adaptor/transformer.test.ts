import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
  PORTABLE_TEXT_BLOCK_TYPE,
} from '@blog/config/constants';
import {
  mockCtaButtonView,
  mockRawCtaButton,
  mockRawTestimonialItem,
  mockRawTestimonialModule,
} from '@blog/service/testing/modules/fixtures';
import {
  MOCK_EXTERNAL_URL,
  mockLinkView,
  mockRawExternalLinkDocument,
  mockRawInternalLinkDocument,
  mockRawPortableTextMarkDef,
  mockRawSanityImage,
} from '@blog/service/testing/shared/fixtures';
import { faker } from '@faker-js/faker';

import { toTestimonialModule } from './transformer';

faker.seed(6014);

const MOCK_NAME = faker.person.fullName();
const MOCK_LINK_LABEL = faker.lorem.words(2);
const MOCK_MARKED_TEXT = faker.lorem.words(2);
const MOCK_CASE_STUDY_URL = faker.internet.url();
const MOCK_MARK_KEY = faker.string.uuid();
const MOCK_BLOCK_KEY = faker.string.uuid();
const MOCK_SPAN_KEY = faker.string.uuid();
const MOCK_IMAGE_ALT = faker.lorem.words(2);
const MOCK_FIRST_QUOTE_ID = faker.string.uuid();
const MOCK_SECOND_QUOTE_ID = faker.string.uuid();

function mockQuoteBlock(
  spans: { text: string; marks: string[] }[],
  markDefs: ReturnType<typeof mockRawPortableTextMarkDef>[],
) {
  return {
    _type: 'block' as const,
    _key: MOCK_BLOCK_KEY,
    style: 'normal' as const,
    children: spans.map((span) => ({
      _type: 'span' as const,
      _key: MOCK_SPAN_KEY,
      ...span,
    })),
    markDefs,
  };
}

describe(toTestimonialModule, () => {
  it('maps brandVariant and displayMode straight through', () => {
    const raw = mockRawTestimonialModule({
      brandVariant: BRAND_VARIANT.SECONDARY,
      displayMode: DISPLAY_MODE.CAROUSEL,
    });

    const module = toTestimonialModule(raw);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
    expect(module.displayMode).toBe(DISPLAY_MODE.CAROUSEL);
  });

  it('leaves contentAlignment and layout undefined when unset', () => {
    const raw = mockRawTestimonialModule({
      contentAlignment: null,
      layout: null,
    });

    const module = toTestimonialModule(raw);

    expect(module.contentAlignment).toBeUndefined();
    expect(module.layout).toBeUndefined();
  });

  it('passes through an authored cardAlignment and contentAlignment', () => {
    const raw = mockRawTestimonialModule({
      cardAlignment: CONTENT_ALIGNMENT.CENTER,
      contentAlignment: CONTENT_ALIGNMENT.RIGHT,
    });

    const module = toTestimonialModule(raw);

    expect(module.cardAlignment).toBe(CONTENT_ALIGNMENT.CENTER);
    expect(module.contentAlignment).toBe(CONTENT_ALIGNMENT.RIGHT);
  });

  it('keeps the quotes in authored order', () => {
    const raw = mockRawTestimonialModule({
      testimonials: [
        mockRawTestimonialItem({ _id: MOCK_SECOND_QUOTE_ID }),
        mockRawTestimonialItem({ _id: MOCK_FIRST_QUOTE_ID }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials.map((item) => item.id)).toEqual([
      MOCK_SECOND_QUOTE_ID,
      MOCK_FIRST_QUOTE_ID,
    ]);
  });

  it('transforms a quote with neither image nor link', () => {
    const raw = mockRawTestimonialModule({
      testimonials: [
        mockRawTestimonialItem({
          name: MOCK_NAME,
          role: null,
          image: null,
          link: null,
        }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials[0]?.name).toBe(MOCK_NAME);
    expect(module.testimonials[0]?.image).toBeUndefined();
    expect(module.testimonials[0]?.link).toBeUndefined();
  });

  it('resolves an image when present', () => {
    const raw = mockRawTestimonialModule({
      testimonials: [
        mockRawTestimonialItem({ image: mockRawSanityImage(MOCK_IMAGE_ALT) }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials[0]?.image?.alt).toBe(MOCK_IMAGE_ALT);
  });

  it('resolves a link to an ILink', () => {
    const raw = mockRawTestimonialModule({
      testimonials: [
        mockRawTestimonialItem({
          link: mockRawExternalLinkDocument({
            label: MOCK_LINK_LABEL,
            url: MOCK_EXTERNAL_URL,
          }),
        }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials[0]?.link).toEqual(
      mockLinkView({ label: MOCK_LINK_LABEL, href: MOCK_EXTERNAL_URL }),
    );
  });

  it('drops an unresolvable link while keeping the item', () => {
    const raw = mockRawTestimonialModule({
      testimonials: [
        mockRawTestimonialItem({
          name: MOCK_NAME,
          link: mockRawInternalLinkDocument({ internalReference: null }),
        }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials[0]?.name).toBe(MOCK_NAME);
    expect(module.testimonials[0]?.link).toBeUndefined();
  });

  it('resolves an inline link mark inside the quote', () => {
    const raw = mockRawTestimonialModule({
      testimonials: [
        mockRawTestimonialItem({
          quote: [
            mockQuoteBlock(
              [
                { text: faker.lorem.word(), marks: [] },
                { text: MOCK_MARKED_TEXT, marks: [MOCK_MARK_KEY] },
              ],
              [
                mockRawPortableTextMarkDef({
                  _key: MOCK_MARK_KEY,
                  link: mockRawExternalLinkDocument({
                    url: MOCK_CASE_STUDY_URL,
                  }),
                }),
              ],
            ),
          ],
        }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials[0]?.quote[0]?.markDefs).toEqual([
      {
        _key: MOCK_MARK_KEY,
        _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
        link: { href: MOCK_CASE_STUDY_URL },
      },
    ]);
  });

  it('drops an unresolvable inline link mark, keeping the quote text', () => {
    const raw = mockRawTestimonialModule({
      testimonials: [
        mockRawTestimonialItem({
          quote: [
            mockQuoteBlock(
              [{ text: MOCK_MARKED_TEXT, marks: [MOCK_MARK_KEY] }],
              [mockRawPortableTextMarkDef({ _key: MOCK_MARK_KEY, link: null })],
            ),
          ],
        }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials[0]?.quote[0]?.children?.[0]?.text).toBe(
      MOCK_MARKED_TEXT,
    );
    expect(
      module.testimonials[0]?.quote[0]?.markDefs?.[0]?.link,
    ).toBeUndefined();
  });

  it('returns an empty array for an absent ctaButtons field', () => {
    const raw = mockRawTestimonialModule({ ctaButtons: null });

    const module = toTestimonialModule(raw);

    expect(module.ctaButtons).toEqual([]);
  });

  it('maps authored ctaButtons', () => {
    const raw = mockRawTestimonialModule({
      ctaButtons: [mockRawCtaButton()],
    });

    const module = toTestimonialModule(raw);

    expect(module.ctaButtons).toEqual([mockCtaButtonView()]);
  });
});
