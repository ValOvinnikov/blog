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

import { toTestimonialModule } from './transformer';

const NAME = 'Alex Chen';
const LINK_LABEL = 'Their site';
const CASE_STUDY_TEXT = 'the case study';
const CASE_STUDY_URL = 'https://example.com/case-study';
const MARK_KEY = 'mark-1';
const IMAGE_ALT = 'A portrait';

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
        mockRawTestimonialItem({ _id: 'quote-b' }),
        mockRawTestimonialItem({ _id: 'quote-a' }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials.map((item) => item.id)).toEqual([
      'quote-b',
      'quote-a',
    ]);
  });

  it('transforms a quote with neither image nor link', () => {
    const raw = mockRawTestimonialModule({
      testimonials: [
        mockRawTestimonialItem({
          name: NAME,
          role: null,
          image: null,
          link: null,
        }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials[0]?.name).toBe(NAME);
    expect(module.testimonials[0]?.image).toBeUndefined();
    expect(module.testimonials[0]?.link).toBeUndefined();
  });

  it('resolves an image when present', () => {
    const raw = mockRawTestimonialModule({
      testimonials: [
        mockRawTestimonialItem({ image: mockRawSanityImage(IMAGE_ALT) }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials[0]?.image?.alt).toBe(IMAGE_ALT);
  });

  it('resolves a link to an ILink', () => {
    const raw = mockRawTestimonialModule({
      testimonials: [
        mockRawTestimonialItem({
          link: mockRawExternalLinkDocument({
            label: LINK_LABEL,
            url: MOCK_EXTERNAL_URL,
          }),
        }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials[0]?.link).toEqual(
      mockLinkView({ label: LINK_LABEL, href: MOCK_EXTERNAL_URL }),
    );
  });

  it('drops an unresolvable link while keeping the item', () => {
    const raw = mockRawTestimonialModule({
      testimonials: [
        mockRawTestimonialItem({
          name: NAME,
          link: mockRawInternalLinkDocument({ internalReference: null }),
        }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials[0]?.name).toBe(NAME);
    expect(module.testimonials[0]?.link).toBeUndefined();
  });

  it('resolves an inline link mark inside the quote', () => {
    const raw = mockRawTestimonialModule({
      testimonials: [
        mockRawTestimonialItem({
          quote: [
            {
              _type: 'block',
              _key: 'block-1',
              style: 'normal',
              children: [
                { _type: 'span', _key: 'span-1', text: 'See ', marks: [] },
                {
                  _type: 'span',
                  _key: 'span-2',
                  text: CASE_STUDY_TEXT,
                  marks: [MARK_KEY],
                },
              ],
              markDefs: [
                mockRawPortableTextMarkDef({
                  _key: MARK_KEY,
                  link: mockRawExternalLinkDocument({ url: CASE_STUDY_URL }),
                }),
              ],
            },
          ],
        }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials[0]?.quote[0]?.markDefs).toEqual([
      {
        _key: MARK_KEY,
        _type: PORTABLE_TEXT_BLOCK_TYPE.LINK_REF,
        link: { href: CASE_STUDY_URL },
      },
    ]);
  });

  it('drops an unresolvable inline link mark, keeping the quote text', () => {
    const raw = mockRawTestimonialModule({
      testimonials: [
        mockRawTestimonialItem({
          quote: [
            {
              _type: 'block',
              _key: 'block-1',
              style: 'normal',
              children: [
                {
                  _type: 'span',
                  _key: 'span-1',
                  text: CASE_STUDY_TEXT,
                  marks: [MARK_KEY],
                },
              ],
              markDefs: [
                mockRawPortableTextMarkDef({ _key: MARK_KEY, link: null }),
              ],
            },
          ],
        }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials[0]?.quote[0]?.children?.[0]?.text).toBe(
      CASE_STUDY_TEXT,
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
