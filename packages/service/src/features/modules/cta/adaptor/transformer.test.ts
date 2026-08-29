import {
  BRAND_VARIANT,
  CONTAINER_WIDTH,
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
  CTA_VARIANT,
  HEADING_ALIGN,
  TLINK_TYPE,
} from '@blog/config';
import {
  makeRawCtaAction,
  makeRawCtaModule,
} from '@blog/service/testing/modules/fixtures';
import { makeRawSanityImage } from '@blog/service/testing/shared/fixtures';

import { toCtaModule } from './transformer';

describe('toCtaModule', () => {
  it('maps sectionHeader and brandVariant', () => {
    const raw = makeRawCtaModule();

    const cta = toCtaModule(raw);

    expect(cta.sectionHeader).toEqual({
      heading: 'Subscribe to the newsletter',
      supportingText: 'Get new posts in your inbox.',
      align: undefined,
    });
    expect(cta.brandVariant).toBe(BRAND_VARIANT.PRIMARY);
  });

  it('maps brandVariant straight through, including BRAND_PRIMARY', () => {
    const raw = makeRawCtaModule({ brandVariant: BRAND_VARIANT.BRAND_PRIMARY });

    const cta = toCtaModule(raw);

    expect(cta.brandVariant).toBe(BRAND_VARIANT.BRAND_PRIMARY);
  });

  it.each([CTA_VARIANT.BANNER, CTA_VARIANT.SPLIT, CTA_VARIANT.CALLOUT])(
    'maps variant %s straight through',
    (variant) => {
      const raw = makeRawCtaModule({ variant });

      const cta = toCtaModule(raw);

      expect(cta.variant).toBe(variant);
    },
  );

  it('leaves supportingText and align undefined when not set (no faked default)', () => {
    const raw = makeRawCtaModule({
      sectionHeader: {
        heading: 'Subscribe to the newsletter',
        supportingText: null,
        align: null,
      },
    });

    const cta = toCtaModule(raw);

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

    const cta = toCtaModule(raw);

    expect(cta.sectionHeader.align).toBe(HEADING_ALIGN.CENTER);
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

  it('passes content through as raw Portable Text blocks when authored', () => {
    const body = [
      {
        _type: 'block' as const,
        _key: 'block-1',
        style: 'normal' as const,
        children: [{ _type: 'span' as const, _key: 'span-1', text: 'Hi.' }],
      },
    ];
    const raw = makeRawCtaModule({ content: body });

    const cta = toCtaModule(raw);

    expect(cta.content).toEqual(body);
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

  it('leaves actions undefined for an empty/absent array (no faked default)', () => {
    const raw = makeRawCtaModule({ actions: null });

    const cta = toCtaModule(raw);

    expect(cta.actions).toBeUndefined();
  });

  it('leaves actions undefined when the actions array is present but empty', () => {
    const raw = makeRawCtaModule({ actions: { actions: [] } });

    const cta = toCtaModule(raw);

    expect(cta.actions).toBeUndefined();
  });

  it('maps a single PRIMARY action', () => {
    const raw = makeRawCtaModule({
      actions: { actions: [makeRawCtaAction()] },
    });

    const cta = toCtaModule(raw);

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
              linkType: TLINK_TYPE.EXTERNAL,
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

    const cta = toCtaModule(raw);

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

    const cta = toCtaModule(raw);

    expect(cta.actions?.[0]).toMatchObject({ variant, appearance });
  });

  it('drops an action whose link cannot resolve to an href', () => {
    const raw = makeRawCtaModule({
      actions: {
        actions: [
          makeRawCtaAction({
            link: {
              label: 'Broken',
              linkType: TLINK_TYPE.INTERNAL,
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

    const cta = toCtaModule(raw);

    expect(cta.actions).toBeUndefined();
  });

  it('survives accessibleLabel into the view-model as ariaLabel', () => {
    const raw = makeRawCtaModule({
      actions: {
        actions: [
          makeRawCtaAction({
            link: {
              label: 'Subscribe',
              linkType: TLINK_TYPE.EXTERNAL,
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

    const cta = toCtaModule(raw);

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
