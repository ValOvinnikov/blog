import {
  BRAND_VARIANT,
  CONTAINER_WIDTH,
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  CTA_ALIGNMENT,
  CTA_VARIANT,
  HEADING_ALIGN,
  LINK_TYPE,
} from '@blog/config';
import {
  makeRawContentBlock,
  makeRawContentMarkDef,
  makeRawCtaAction,
  makeRawCtaModule,
} from '@blog/service/testing/modules/fixtures';
import { makeRawSanityImage } from '@blog/service/testing/shared/fixtures';
import { makeTenant } from '@blog/service/testing/tenant';

import { toCtaModule } from './transformer';

describe('toCtaModule', () => {
  it('maps sectionHeader and brandVariant', () => {
    const raw = makeRawCtaModule();

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.sectionHeader).toEqual({
      heading: 'Subscribe to the newsletter',
      supportingText: 'Get new posts in your inbox.',
      align: undefined,
    });
    expect(cta.brandVariant).toBe(BRAND_VARIANT.PRIMARY);
  });

  it('maps brandVariant straight through, including BRAND_PRIMARY', () => {
    const raw = makeRawCtaModule({ brandVariant: BRAND_VARIANT.BRAND_PRIMARY });

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.brandVariant).toBe(BRAND_VARIANT.BRAND_PRIMARY);
  });

  it('maps bandTone straight through', () => {
    const raw = makeRawCtaModule({ bandTone: BRAND_VARIANT.SECONDARY });

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.bandTone).toBe(BRAND_VARIANT.SECONDARY);
  });

  it('maps bandTone straight through, including BRAND_PRIMARY', () => {
    const raw = makeRawCtaModule({ bandTone: BRAND_VARIANT.BRAND_PRIMARY });

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.bandTone).toBe(BRAND_VARIANT.BRAND_PRIMARY);
  });

  it.each([CTA_VARIANT.BANNER, CTA_VARIANT.SPLIT, CTA_VARIANT.CALLOUT])(
    'maps variant %s straight through',
    (variant) => {
      const raw = makeRawCtaModule({ variant });

      const cta = toCtaModule(raw, makeTenant());

      expect(cta.variant).toBe(variant);
    },
  );

  it('takes contentPosition from contentPositionSplit on Split, ignoring contentPositionBanner', () => {
    const raw = makeRawCtaModule({
      variant: CTA_VARIANT.SPLIT,
      contentPositionSplit: CTA_ALIGNMENT.RIGHT,
      contentPositionBanner: CTA_ALIGNMENT.LEFT,
    });

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.contentPosition).toBe(CTA_ALIGNMENT.RIGHT);
  });

  it('takes contentPosition from contentPositionBanner on Banner, ignoring contentPositionSplit', () => {
    const raw = makeRawCtaModule({
      variant: CTA_VARIANT.BANNER,
      contentPositionSplit: CTA_ALIGNMENT.RIGHT,
      contentPositionBanner: CTA_ALIGNMENT.LEFT,
    });

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.contentPosition).toBe(CTA_ALIGNMENT.LEFT);
  });

  it('maps a Banner contentPositionBanner of CENTER through', () => {
    const raw = makeRawCtaModule({
      variant: CTA_VARIANT.BANNER,
      contentPositionBanner: CTA_ALIGNMENT.CENTER,
    });

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.contentPosition).toBe(CTA_ALIGNMENT.CENTER);
  });

  it('leaves contentPosition undefined on Callout regardless of stored position keys', () => {
    const raw = makeRawCtaModule({
      variant: CTA_VARIANT.CALLOUT,
      contentPositionSplit: CTA_ALIGNMENT.RIGHT,
      contentPositionBanner: CTA_ALIGNMENT.CENTER,
    });

    const cta = toCtaModule(raw, makeTenant());

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

    expect(toCtaModule(splitRaw, makeTenant()).contentPosition).toBeUndefined();
    expect(
      toCtaModule(bannerRaw, makeTenant()).contentPosition,
    ).toBeUndefined();
  });

  it('leaves contentAlignment undefined when unset', () => {
    const raw = makeRawCtaModule({ contentAlignment: null });

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.contentAlignment).toBeUndefined();
  });

  it('maps contentAlignment when authored, independent of variant', () => {
    const raw = makeRawCtaModule({ contentAlignment: CTA_ALIGNMENT.CENTER });

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.contentAlignment).toBe(CTA_ALIGNMENT.CENTER);
  });

  it('leaves supportingText and align undefined when not set (no faked default)', () => {
    const raw = makeRawCtaModule({
      sectionHeader: {
        heading: 'Subscribe to the newsletter',
        supportingText: null,
        align: null,
      },
    });

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.sectionHeader.supportingText).toBeUndefined();
    expect(cta.sectionHeader.align).toBeUndefined();
  });

  it('maps sectionHeader.align when authored', () => {
    const raw = makeRawCtaModule({
      sectionHeader: {
        heading: 'Subscribe to the newsletter',
        supportingText: null,
        align: HEADING_ALIGN.CENTER,
      },
    });

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.sectionHeader.align).toBe(HEADING_ALIGN.CENTER);
  });

  it('leaves eyebrow and footnote undefined when unset', () => {
    const raw = makeRawCtaModule({ eyebrow: null, footnote: null });

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.eyebrow).toBeUndefined();
    expect(cta.footnote).toBeUndefined();
  });

  it('maps eyebrow and footnote when authored', () => {
    const raw = makeRawCtaModule({
      eyebrow: 'Limited time',
      footnote: 'No spam, unsubscribe anytime.',
    });

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.eyebrow).toBe('Limited time');
    expect(cta.footnote).toBe('No spam, unsubscribe anytime.');
  });

  it('leaves content undefined when unset', () => {
    const raw = makeRawCtaModule({ content: null });

    const cta = toCtaModule(raw, makeTenant());

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

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.content).toEqual([{ ...body[0], markDefs: undefined }]);
  });

  it('resolves an internal-document link inside content to a real href', () => {
    const raw = makeRawCtaModule({
      content: [
        makeRawContentBlock({
          markDefs: [
            makeRawContentMarkDef({
              linkType: LINK_TYPE.INTERNAL,
              internalReference: { _type: 'blog_post', slug: 'hello-world' },
            }),
          ],
        }),
      ],
    });

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.content?.[0]?.markDefs?.[0]).toMatchObject({
      _key: 'mark-1',
      _type: 'link',
      url: '/blog/hello-world',
    });
  });

  it('resolves an internal blog_topic and page_generic reference the same way toLink does', () => {
    const topicRaw = makeRawCtaModule({
      content: [
        makeRawContentBlock({
          markDefs: [
            makeRawContentMarkDef({
              linkType: LINK_TYPE.INTERNAL,
              internalReference: { _type: 'blog_topic', slug: 'engineering' },
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
              linkType: LINK_TYPE.INTERNAL,
              internalReference: { _type: 'page_generic', slug: 'about' },
            }),
          ],
        }),
      ],
    });

    expect(
      toCtaModule(topicRaw, makeTenant()).content?.[0]?.markDefs?.[0]?.url,
    ).toBe('/topics/engineering');
    expect(
      toCtaModule(pageRaw, makeTenant()).content?.[0]?.markDefs?.[0]?.url,
    ).toBe('/about');
  });

  it('keeps an external content link working as before', () => {
    const raw = makeRawCtaModule({
      content: [
        makeRawContentBlock({
          markDefs: [
            makeRawContentMarkDef({
              linkType: LINK_TYPE.EXTERNAL,
              url: 'https://example.com',
            }),
          ],
        }),
      ],
    });

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.content?.[0]?.markDefs?.[0]?.url).toBe('https://example.com');
  });

  it('degrades a malformed content link (no url, no reference) to an unresolved url rather than throwing', () => {
    const raw = makeRawCtaModule({
      content: [
        makeRawContentBlock({
          markDefs: [
            makeRawContentMarkDef({
              linkType: LINK_TYPE.INTERNAL,
              internalReference: null,
              url: null,
            }),
          ],
        }),
      ],
    });

    expect(() => toCtaModule(raw, makeTenant())).not.toThrow();
    const cta = toCtaModule(raw, makeTenant());
    expect(cta.content?.[0]?.markDefs?.[0]?.url).toBeUndefined();
    expect(cta.content?.[0]?.markDefs?.[0]?._key).toBe('mark-1');
  });

  it('leaves image undefined when unset', () => {
    const raw = makeRawCtaModule({ image: null });

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.image).toBeUndefined();
  });

  it('maps image when authored', () => {
    const raw = makeRawCtaModule({ image: makeRawSanityImage() });

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.image).toEqual({
      assetId: 'image-abc123-800x600-jpg',
      alt: 'Alt text',
      cdnBaseUrl: 'https://cdn.sanity.io/images/tenant-a/production/',
      hotspot: undefined,
      crop: undefined,
      lqip: 'data:image/png;base64,abc123',
      dimensions: { width: 800, height: 600, aspectRatio: 1.333 },
    });
  });

  it('derives the image cdnBaseUrl from the given tenant, not a shared default', () => {
    const raw = makeRawCtaModule({ image: makeRawSanityImage() });

    const ctaA = toCtaModule(raw, makeTenant({ projectId: 'proj-a' }));
    const ctaB = toCtaModule(raw, makeTenant({ projectId: 'proj-b' }));

    expect(ctaA.image?.cdnBaseUrl).toBe(
      'https://cdn.sanity.io/images/proj-a/production/',
    );
    expect(ctaB.image?.cdnBaseUrl).toBe(
      'https://cdn.sanity.io/images/proj-b/production/',
    );
  });

  it('returns an empty array for an absent actions field', () => {
    const raw = makeRawCtaModule({ actions: null });

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.actions).toEqual([]);
  });

  it('returns an empty array when the actions array is present but empty', () => {
    const raw = makeRawCtaModule({ actions: { actions: [] } });

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.actions).toEqual([]);
  });

  it('maps a single PRIMARY action', () => {
    const raw = makeRawCtaModule({
      actions: { actions: [makeRawCtaAction()] },
    });

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.actions).toEqual([
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

  it('maps PRIMARY and SECONDARY actions, preserving order', () => {
    const raw = makeRawCtaModule({
      actions: {
        actions: [
          makeRawCtaAction({ variant: CTA_ACTION_VARIANT.PRIMARY }),
          makeRawCtaAction({
            variant: CTA_ACTION_VARIANT.SECONDARY,
            appearance: CTA_ACTION_APPEARANCE.INLINE,
            link: {
              label: 'Learn more',
              linkType: LINK_TYPE.EXTERNAL,
              url: '/learn-more',
              internalReference: null,
              openInNewTab: null,
              platform: null,
              accessibleLabel: null,
            },
          }),
        ],
      },
    });

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.actions).toHaveLength(2);
    expect(cta.actions?.[0]).toMatchObject({
      variant: CTA_ACTION_VARIANT.PRIMARY,
    });
    expect(cta.actions?.[1]).toMatchObject({
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
      actions: { actions: [makeRawCtaAction({ variant, appearance })] },
    });

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.actions?.[0]).toMatchObject({ variant, appearance });
  });

  it('drops an action whose link cannot resolve to an href', () => {
    const raw = makeRawCtaModule({
      actions: {
        actions: [
          makeRawCtaAction({
            link: {
              label: 'Broken',
              linkType: LINK_TYPE.INTERNAL,
              url: null,
              internalReference: null,
              openInNewTab: null,
              platform: null,
              accessibleLabel: null,
            },
          }),
        ],
      },
    });

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.actions).toEqual([]);
  });

  it('survives accessibleLabel into the view-model as ariaLabel', () => {
    const raw = makeRawCtaModule({
      actions: {
        actions: [
          makeRawCtaAction({
            link: {
              label: 'Subscribe',
              linkType: LINK_TYPE.EXTERNAL,
              url: '/newsletter',
              internalReference: null,
              openInNewTab: null,
              platform: null,
              accessibleLabel: 'Subscribe to the newsletter',
            },
          }),
        ],
      },
    });

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.actions?.[0]?.link.ariaLabel).toBe(
      'Subscribe to the newsletter',
    );
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

    const cta = toCtaModule(raw, makeTenant());

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

    const cta = toCtaModule(raw, makeTenant());

    expect(cta.layout).toBeUndefined();
  });
});
