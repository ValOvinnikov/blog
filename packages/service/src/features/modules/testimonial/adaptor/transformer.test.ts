import { BRAND_VARIANT, CONTENT_ALIGNMENT, DISPLAY_MODE } from '@blog/config';
import {
  makeRawCtaButton,
  makeRawTestimonialItem,
  makeRawTestimonialModule,
} from '@blog/service/testing/modules/fixtures';
import {
  makeRawExternalLinkDocument,
  makeRawInternalLinkDocument,
  makeRawPortableTextMarkDef,
  makeRawSanityImage,
} from '@blog/service/testing/shared/fixtures';

import { toTestimonialModule } from './transformer';

describe('toTestimonialModule', () => {
  it('maps brandVariant and displayMode straight through', () => {
    const raw = makeRawTestimonialModule({
      brandVariant: BRAND_VARIANT.SECONDARY,
      displayMode: DISPLAY_MODE.CAROUSEL,
    });

    const module = toTestimonialModule(raw);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
    expect(module.displayMode).toBe(DISPLAY_MODE.CAROUSEL);
  });

  it('leaves cardAlignment, contentAlignment and layout undefined when unset (no faked default)', () => {
    const raw = makeRawTestimonialModule({
      cardAlignment: null,
      contentAlignment: null,
      layout: null,
    });

    const module = toTestimonialModule(raw);

    expect(module.cardAlignment).toBeUndefined();
    expect(module.contentAlignment).toBeUndefined();
    expect(module.layout).toBeUndefined();
  });

  it('passes through an authored cardAlignment and contentAlignment', () => {
    const raw = makeRawTestimonialModule({
      cardAlignment: CONTENT_ALIGNMENT.CENTER,
      contentAlignment: CONTENT_ALIGNMENT.RIGHT,
    });

    const module = toTestimonialModule(raw);

    expect(module.cardAlignment).toBe(CONTENT_ALIGNMENT.CENTER);
    expect(module.contentAlignment).toBe(CONTENT_ALIGNMENT.RIGHT);
  });

  it('keeps the quotes in authored order', () => {
    const raw = makeRawTestimonialModule({
      testimonials: [
        makeRawTestimonialItem({ _id: 'quote-b' }),
        makeRawTestimonialItem({ _id: 'quote-a' }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials.map((item) => item.id)).toEqual([
      'quote-b',
      'quote-a',
    ]);
  });

  it('transforms a quote with neither image nor link', () => {
    const raw = makeRawTestimonialModule({
      testimonials: [
        makeRawTestimonialItem({
          name: 'Alex Chen',
          role: null,
          image: null,
          link: null,
        }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials[0]).toMatchObject({ name: 'Alex Chen' });
    expect(module.testimonials[0]?.image).toBeUndefined();
    expect(module.testimonials[0]?.link).toBeUndefined();
  });

  it('resolves an image when present', () => {
    const raw = makeRawTestimonialModule({
      testimonials: [
        makeRawTestimonialItem({ image: makeRawSanityImage('A portrait') }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials[0]?.image?.alt).toBe('A portrait');
  });

  it('resolves a link to an ILink', () => {
    const raw = makeRawTestimonialModule({
      testimonials: [
        makeRawTestimonialItem({
          link: makeRawExternalLinkDocument({
            label: 'Their site',
            url: 'https://example.com',
          }),
        }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials[0]?.link).toEqual({
      label: 'Their site',
      href: 'https://example.com',
      target: undefined,
      platform: undefined,
      ariaLabel: undefined,
    });
  });

  it('drops an unresolvable link while keeping the item', () => {
    const raw = makeRawTestimonialModule({
      testimonials: [
        makeRawTestimonialItem({
          name: 'Sam Okafor',
          link: makeRawInternalLinkDocument({ internalReference: null }),
        }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials[0]?.name).toBe('Sam Okafor');
    expect(module.testimonials[0]?.link).toBeUndefined();
  });

  it('resolves an inline link mark inside the quote', () => {
    const raw = makeRawTestimonialModule({
      testimonials: [
        makeRawTestimonialItem({
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
                  text: 'the case study',
                  marks: ['mark-1'],
                },
              ],
              markDefs: [
                makeRawPortableTextMarkDef({
                  _key: 'mark-1',
                  link: makeRawExternalLinkDocument({
                    url: 'https://example.com/case-study',
                  }),
                }),
              ],
            },
          ],
        }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials[0]?.quote[0]?.markDefs?.[0]).toMatchObject({
      _key: 'mark-1',
      link: { href: 'https://example.com/case-study' },
    });
  });

  it('drops an inline link mark that cannot resolve, keeping the quote text', () => {
    const raw = makeRawTestimonialModule({
      testimonials: [
        makeRawTestimonialItem({
          quote: [
            {
              _type: 'block',
              _key: 'block-1',
              style: 'normal',
              children: [
                {
                  _type: 'span',
                  _key: 'span-1',
                  text: 'the case study',
                  marks: ['mark-1'],
                },
              ],
              markDefs: [
                makeRawPortableTextMarkDef({ _key: 'mark-1', link: null }),
              ],
            },
          ],
        }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials[0]?.quote[0]?.children?.[0]?.text).toBe(
      'the case study',
    );
    expect(
      module.testimonials[0]?.quote[0]?.markDefs?.[0]?.link,
    ).toBeUndefined();
  });

  it('returns an empty array for an absent ctaButtons field', () => {
    const raw = makeRawTestimonialModule({ ctaButtons: null });

    const module = toTestimonialModule(raw);

    expect(module.ctaButtons).toEqual([]);
  });

  it('maps authored ctaButtons', () => {
    const raw = makeRawTestimonialModule({
      ctaButtons: [makeRawCtaButton()],
    });

    const module = toTestimonialModule(raw);

    expect(module.ctaButtons).toHaveLength(1);
    expect(module.ctaButtons[0]).toMatchObject({
      link: { label: 'Subscribe', href: '/newsletter' },
    });
  });
});
