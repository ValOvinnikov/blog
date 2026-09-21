import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
  LINK_TYPE,
} from '@blog/config';
import {
  makeRawCtaButton,
  makeRawTestimonialItem,
  makeRawTestimonialModule,
} from '@blog/service/testing/modules/fixtures';
import { makeRawSanityImage } from '@blog/service/testing/shared/fixtures';

import { toTestimonialModule } from './transformer';

describe('toTestimonialModule', () => {
  it('maps brandVariant, displayMode, showImages and cardAlignment straight through', () => {
    const raw = makeRawTestimonialModule({
      brandVariant: BRAND_VARIANT.SECONDARY,
      displayMode: DISPLAY_MODE.CAROUSEL,
      showImages: false,
      cardAlignment: CONTENT_ALIGNMENT.CENTER,
    });

    const module = toTestimonialModule(raw);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
    expect(module.displayMode).toBe(DISPLAY_MODE.CAROUSEL);
    expect(module.showImages).toBe(false);
    expect(module.cardAlignment).toBe(CONTENT_ALIGNMENT.CENTER);
  });

  it('leaves contentAlignment and layout undefined when unset (no faked default)', () => {
    const raw = makeRawTestimonialModule({
      contentAlignment: null,
      layout: null,
    });

    const module = toTestimonialModule(raw);

    expect(module.contentAlignment).toBeUndefined();
    expect(module.layout).toBeUndefined();
  });

  it('keeps the testimonials in authored order', () => {
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

  it('degrades to an empty testimonials array when the field is unset (no throw)', () => {
    const raw = makeRawTestimonialModule({ testimonials: null });

    const module = toTestimonialModule(raw);

    expect(module.testimonials).toEqual([]);
  });

  it('transforms a testimonial with no photo and no role', () => {
    const raw = makeRawTestimonialModule({
      testimonials: [
        makeRawTestimonialItem({ role: null, photo: null, link: null }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials[0]).toMatchObject({
      role: undefined,
      photo: undefined,
      link: undefined,
    });
  });

  it('resolves a testimonial photo to a sanity image', () => {
    const raw = makeRawTestimonialModule({
      testimonials: [
        makeRawTestimonialItem({
          photo: makeRawSanityImage('Jamie Rivera portrait'),
        }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials[0]?.photo?.alt).toBe('Jamie Rivera portrait');
  });

  it('resolves a testimonial link to an ILink', () => {
    const raw = makeRawTestimonialModule({
      testimonials: [
        makeRawTestimonialItem({
          link: {
            label: 'Read the case study',
            linkType: LINK_TYPE.EXTERNAL,
            url: 'https://example.com/case-study',
            internalReference: null,
            openInNewTab: null,
          },
        }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials[0]?.link).toEqual({
      label: 'Read the case study',
      href: 'https://example.com/case-study',
      target: undefined,
      platform: undefined,
      ariaLabel: undefined,
    });
  });

  it('drops a testimonial link that cannot resolve to an href, keeping the testimonial', () => {
    const raw = makeRawTestimonialModule({
      testimonials: [
        makeRawTestimonialItem({
          link: {
            label: 'Broken',
            linkType: LINK_TYPE.INTERNAL,
            internalReference: null,
            url: null,
            openInNewTab: null,
          },
        }),
      ],
    });

    const module = toTestimonialModule(raw);

    expect(module.testimonials).toHaveLength(1);
    expect(module.testimonials[0]?.link).toBeUndefined();
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
