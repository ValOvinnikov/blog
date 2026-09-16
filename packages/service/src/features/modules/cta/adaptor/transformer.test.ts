import {
  BRAND_VARIANT,
  CONTAINER_WIDTH,
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  CONTENT_ALIGNMENT,
  CTA_VARIANT,
  LINK_TYPE,
} from '@blog/config';
import {
  makeRawContentBlock,
  makeRawContentMarkDef,
  makeRawCtaButton,
  makeRawCtaModule,
} from '@blog/service/testing/modules/fixtures';
import {
  makeRawHeadingBlock,
  makeRawSanityImage,
} from '@blog/service/testing/shared/fixtures';

import { toCtaModule } from './transformer';

describe('toCtaModule', () => {
  it('maps headingBlock and brandVariant', () => {
    const raw = makeRawCtaModule();

    const cta = toCtaModule(raw);

    expect(cta.headingBlock).toEqual({
      heading: 'Subscribe to the newsletter',
      supportingText: 'Get new posts in your inbox.',
    });
    expect(cta.brandVariant).toBe(BRAND_VARIANT.PRIMARY);
  });

  it('maps brandVariant straight through, including BRAND_PRIMARY', () => {
    const raw = makeRawCtaModule({ brandVariant: BRAND_VARIANT.BRAND_PRIMARY });

    const cta = toCtaModule(raw);

    expect(cta.brandVariant).toBe(BRAND_VARIANT.BRAND_PRIMARY);
  });

  it('maps bandTone straight through', () => {
    const raw = makeRawCtaModule({ bandTone: BRAND_VARIANT.SECONDARY });

    const cta = toCtaModule(raw);

    expect(cta.bandTone).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('maps bandTone straight through, including BRAND_PRIMARY', () => {
    const raw = makeRawCtaModule({ bandTone: BRAND_VARIANT.BRAND_PRIMARY });

    const cta = toCtaModule(raw);

    expect(cta.bandTone).toBe(BRAND_VARIANT.BRAND_PRIMARY);
  });

  it.each([CTA_VARIANT.BANNER, CTA_VARIANT.SPLIT, CTA_VARIANT.CALLOUT])(
    'maps variant %s straight through',
    (variant) => {
      const raw = makeRawCtaModule({ variant });

      const cta = toCtaModule(raw);

      expect(cta.variant).toBe(variant);
    },
  );

  it('takes contentPosition from contentPositionSplit on Split, ignoring contentPositionBanner', () => {
    const raw = makeRawCtaModule({
      variant: CTA_VARIANT.SPLIT,
      contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
      contentPositionBanner: CONTENT_ALIGNMENT.LEFT,
    });

    const cta = toCtaModule(raw);

    expect(cta.contentPosition).toBe(CONTENT_ALIGNMENT.RIGHT);
  });

  it('takes contentPosition from contentPositionBanner on Banner, ignoring contentPositionSplit', () => {
    const raw = makeRawCtaModule({
      variant: CTA_VARIANT.BANNER,
      contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
      contentPositionBanner: CONTENT_ALIGNMENT.LEFT,
    });

    const cta = toCtaModule(raw);

    expect(cta.contentPosition).toBe(CONTENT_ALIGNMENT.LEFT);
  });

  it('maps a Banner contentPositionBanner of CENTER through', () => {
    const raw = makeRawCtaModule({
      variant: CTA_VARIANT.BANNER,
      contentPositionBanner: CONTENT_ALIGNMENT.CENTER,
    });

    const cta = toCtaModule(raw);

    expect(cta.contentPosition).toBe(CONTENT_ALIGNMENT.CENTER);
  });

  it('leaves contentPosition undefined on Callout regardless of stored position keys', () => {
    const raw = makeRawCtaModule({
      variant: CTA_VARIANT.CALLOUT,
      contentPositionSplit: CONTENT_ALIGNMENT.RIGHT,
      contentPositionBanner: CONTENT_ALIGNMENT.CENTER,
    });

    const cta = toCtaModule(raw);

    expect(cta.contentPosition).toBeUndefined();
  });

  it('leaves contentPosition undefined on Split/Banner when the matching key is unset', () => {
    const splitRaw = makeRawCtaModule({
      variant: CTA_VARIANT.SPLIT,
      contentPositionSplit: null,
    });
    const bannerRaw = makeRawCtaModule({
      variant: CTA_VARIANT.BANNER,
      contentPositionBanner: null,
    });

    expect(toCtaModule(splitRaw).contentPosition).toBeUndefined();
    expect(toCtaModule(bannerRaw).contentPosition).toBeUndefined();
  });

  it('leaves contentAlignment undefined when unset', () => {
    const raw = makeRawCtaModule({ contentAlignment: null });

    const cta = toCtaModule(raw);

    expect(cta.contentAlignment).toBeUndefined();
  });

  it('maps contentAlignment when authored, independent of variant', () => {
    const raw = makeRawCtaModule({
      contentAlignment: CONTENT_ALIGNMENT.CENTER,
    });

    const cta = toCtaModule(raw);

    expect(cta.contentAlignment).toBe(CONTENT_ALIGNMENT.CENTER);
  });

  it('leaves supportingText undefined when not set (no faked default)', () => {
    const raw = makeRawCtaModule({
      headingBlock: makeRawHeadingBlock('Subscribe to the newsletter'),
    });

    const cta = toCtaModule(raw);

    expect(cta.headingBlock.supportingText).toBeUndefined();
  });

  it('leaves eyebrow and footnote undefined when unset', () => {
    const raw = makeRawCtaModule({ eyebrow: null, footnote: null });

    const cta = toCtaModule(raw);

    expect(cta.eyebrow).toBeUndefined();
    expect(cta.footnote).toBeUndefined();
  });

  it('maps eyebrow and footnote when authored', () => {
    const raw = makeRawCtaModule({
      eyebrow: 'Limited time',
      footnote: 'No spam, unsubscribe anytime.',
    });

    const cta = toCtaModule(raw);

    expect(cta.eyebrow).toBe('Limited time');
    expect(cta.footnote).toBe('No spam, unsubscribe anytime.');
  });

  it('leaves content undefined when unset', () => {
    const raw = makeRawCtaModule({ content: null });

    const cta = toCtaModule(raw);

    expect(cta.content).toBeUndefined();
  });

  it('passes a plain block through unchanged when it has no markDefs', () => {
    const body = [
      {
        _type: 'block' as const,
        _key: 'block-1',
        style: 'normal' as const,
        children: [{ _type: 'span' as const, _key: 'span-1', text: 'Hi.' }],
        markDefs: null,
      },
    ];
    const raw = makeRawCtaModule({ content: body });

    const cta = toCtaModule(raw);

    expect(cta.content).toEqual([{ ...body[0], markDefs: undefined }]);
  });

  it('resolves an internal-document link inside content to a real href', () => {
    const raw = makeRawCtaModule({
      content: [
        makeRawContentBlock({
          markDefs: [
            makeRawContentMarkDef({
              link: {
                label: 'Learn more',
                linkType: LINK_TYPE.INTERNAL,
                internalReference: { _type: 'page_post', slug: 'hello-world' },
                url: null,
                openInNewTab: null,
              },
            }),
          ],
        }),
      ],
    });

    const cta = toCtaModule(raw);

    expect(cta.content?.[0]?.markDefs?.[0]).toMatchObject({
      _key: 'mark-1',
      _type: 'linkRef',
      link: { href: '/blog/hello-world' },
    });
  });

  it('resolves an internal page_topic and page_landing reference the same way toLinkDocument does', () => {
    const topicRaw = makeRawCtaModule({
      content: [
        makeRawContentBlock({
          markDefs: [
            makeRawContentMarkDef({
              link: {
                label: 'Learn more',
                linkType: LINK_TYPE.INTERNAL,
                internalReference: { _type: 'page_topic', slug: 'engineering' },
                url: null,
                openInNewTab: null,
              },
            }),
          ],
        }),
      ],
    });
    const pageRaw = makeRawCtaModule({
      content: [
        makeRawContentBlock({
          markDefs: [
            makeRawContentMarkDef({
              link: {
                label: 'Learn more',
                linkType: LINK_TYPE.INTERNAL,
                internalReference: { _type: 'page_landing', slug: 'about' },
                url: null,
                openInNewTab: null,
              },
            }),
          ],
        }),
      ],
    });

    expect(toCtaModule(topicRaw).content?.[0]?.markDefs?.[0]?.link?.href).toBe(
      '/topics/engineering',
    );
    expect(toCtaModule(pageRaw).content?.[0]?.markDefs?.[0]?.link?.href).toBe(
      '/about',
    );
  });

  it('keeps an external content link working as before', () => {
    const raw = makeRawCtaModule({
      content: [
        makeRawContentBlock({
          markDefs: [
            makeRawContentMarkDef({
              link: {
                label: 'Learn more',
                linkType: LINK_TYPE.EXTERNAL,
                url: 'https://example.com',
                internalReference: null,
                openInNewTab: null,
              },
            }),
          ],
        }),
      ],
    });

    const cta = toCtaModule(raw);

    expect(cta.content?.[0]?.markDefs?.[0]?.link?.href).toBe(
      'https://example.com',
    );
  });

  it('degrades a dangling content link to an absent link rather than throwing', () => {
    const raw = makeRawCtaModule({
      content: [
        makeRawContentBlock({
          markDefs: [makeRawContentMarkDef({ link: null })],
        }),
      ],
    });

    expect(() => toCtaModule(raw)).not.toThrow();
    const cta = toCtaModule(raw);
    expect(cta.content?.[0]?.markDefs?.[0]?.link).toBeUndefined();
    expect(cta.content?.[0]?.markDefs?.[0]?._key).toBe('mark-1');
  });

  it('leaves image undefined when unset', () => {
    const raw = makeRawCtaModule({ image: null });

    const cta = toCtaModule(raw);

    expect(cta.image).toBeUndefined();
  });

  it('maps image when authored', () => {
    const raw = makeRawCtaModule({ image: makeRawSanityImage() });

    const cta = toCtaModule(raw);

    expect(cta.image).toEqual({
      assetId: 'image-abc123-800x600-jpg',
      alt: 'Alt text',
      hotspot: undefined,
      crop: undefined,
      lqip: 'data:image/png;base64,abc123',
      dimensions: { width: 800, height: 600, aspectRatio: 1.333 },
    });
  });

  it('returns an empty array for an absent ctaButtons field', () => {
    const raw = makeRawCtaModule({ ctaButtons: null });

    const cta = toCtaModule(raw);

    expect(cta.ctaButtons).toEqual([]);
  });

  it('returns an empty array when the ctaButtons array is present but empty', () => {
    const raw = makeRawCtaModule({ ctaButtons: [] });

    const cta = toCtaModule(raw);

    expect(cta.ctaButtons).toEqual([]);
  });

  it('maps a single PRIMARY button', () => {
    const raw = makeRawCtaModule({
      ctaButtons: [makeRawCtaButton()],
    });

    const cta = toCtaModule(raw);

    expect(cta.ctaButtons).toEqual([
      {
        variant: CTA_ACTION_VARIANT.PRIMARY,
        appearance: CTA_ACTION_APPEARANCE.CONTAINED,
        link: {
          label: 'Subscribe',
          href: '/newsletter',
          target: undefined,
          platform: undefined,
          ariaLabel: undefined,
        },
      },
    ]);
  });

  it('maps PRIMARY and SECONDARY buttons, preserving order', () => {
    const raw = makeRawCtaModule({
      ctaButtons: [
        makeRawCtaButton({ variant: CTA_ACTION_VARIANT.PRIMARY }),
        makeRawCtaButton({
          variant: CTA_ACTION_VARIANT.SECONDARY,
          appearance: CTA_ACTION_APPEARANCE.INLINE,
          link: {
            label: 'Learn more',
            linkType: LINK_TYPE.EXTERNAL,
            url: '/learn-more',
            internalReference: null,
            openInNewTab: null,
          },
        }),
      ],
    });

    const cta = toCtaModule(raw);

    expect(cta.ctaButtons).toHaveLength(2);
    expect(cta.ctaButtons?.[0]).toMatchObject({
      variant: CTA_ACTION_VARIANT.PRIMARY,
    });
    expect(cta.ctaButtons?.[1]).toMatchObject({
      variant: CTA_ACTION_VARIANT.SECONDARY,
      appearance: CTA_ACTION_APPEARANCE.INLINE,
    });
  });

  it.each([
    [CTA_ACTION_VARIANT.PRIMARY, CTA_ACTION_APPEARANCE.CONTAINED],
    [CTA_ACTION_VARIANT.PRIMARY, CTA_ACTION_APPEARANCE.INLINE],
    [CTA_ACTION_VARIANT.SECONDARY, CTA_ACTION_APPEARANCE.CONTAINED],
    [CTA_ACTION_VARIANT.SECONDARY, CTA_ACTION_APPEARANCE.INLINE],
  ])('maps variant %s with appearance %s', (variant, appearance) => {
    const raw = makeRawCtaModule({
      ctaButtons: [makeRawCtaButton({ variant, appearance })],
    });

    const cta = toCtaModule(raw);

    expect(cta.ctaButtons?.[0]).toMatchObject({ variant, appearance });
  });

  it('drops a button whose link cannot resolve to an href', () => {
    const raw = makeRawCtaModule({
      ctaButtons: [
        makeRawCtaButton({
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

    const cta = toCtaModule(raw);

    expect(cta.ctaButtons).toEqual([]);
  });

  it('resolves a ctaButton pointing at an internal page to that page route', () => {
    const raw = makeRawCtaModule({
      ctaButtons: [
        makeRawCtaButton({
          link: {
            label: 'Read the post',
            linkType: LINK_TYPE.INTERNAL,
            internalReference: { _type: 'page_post', slug: 'hello-world' },
            url: null,
            openInNewTab: null,
          },
        }),
      ],
    });

    const cta = toCtaModule(raw);

    expect(cta.ctaButtons?.[0]?.link.href).toBe('/blog/hello-world');
  });

  it('maps a fully-authored layout object 1:1', () => {
    const raw = makeRawCtaModule({
      layout: {
        spacingTop: 'LG',
        spacingBottom: 'SM',
        containerWidth: CONTAINER_WIDTH.NARROW,
        dividerTop: true,
        dividerBottom: false,
      },
    });

    const cta = toCtaModule(raw);

    expect(cta.layout).toEqual({
      spacingTop: 'LG',
      spacingBottom: 'SM',
      containerWidth: CONTAINER_WIDTH.NARROW,
      dividerTop: true,
      dividerBottom: false,
    });
  });

  it('leaves layout undefined when the field is unset (no faked default)', () => {
    const raw = makeRawCtaModule({ layout: null });

    const cta = toCtaModule(raw);

    expect(cta.layout).toBeUndefined();
  });
});
