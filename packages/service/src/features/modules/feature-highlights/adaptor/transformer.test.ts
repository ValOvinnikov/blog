import {
  BRAND_VARIANT,
  CTA_ACTION_VARIANT,
  LINK_TYPE,
  MEDIA_ORDER,
} from '@blog/config';
import {
  makeRawCtaButton,
  makeRawFeatureHighlightItem,
  makeRawFeatureHighlightsModule,
} from '@blog/service/testing/modules/fixtures';

import { toFeatureHighlightsModule } from './transformer';

describe('toFeatureHighlightsModule', () => {
  it('maps brandVariant and mediaOrder straight through', () => {
    const raw = makeRawFeatureHighlightsModule({
      brandVariant: BRAND_VARIANT.SECONDARY,
      mediaOrder: MEDIA_ORDER.LAST,
    });

    const module = toFeatureHighlightsModule(raw);

    expect(module.brandVariant).toBe(BRAND_VARIANT.SECONDARY);
    expect(module.mediaOrder).toBe(MEDIA_ORDER.LAST);
  });

  it('leaves contentAlignment and layout undefined when unset (no faked default)', () => {
    const raw = makeRawFeatureHighlightsModule({
      contentAlignment: null,
      layout: null,
    });

    const module = toFeatureHighlightsModule(raw);

    expect(module.contentAlignment).toBeUndefined();
    expect(module.layout).toBeUndefined();
  });

  it('keeps the highlights in authored order', () => {
    const raw = makeRawFeatureHighlightsModule({
      highlights: [
        makeRawFeatureHighlightItem({ _key: 'block-highlight-b' }),
        makeRawFeatureHighlightItem({ _key: 'block-highlight-a' }),
        makeRawFeatureHighlightItem({ _key: 'block-highlight-c' }),
      ],
    });

    const module = toFeatureHighlightsModule(raw);

    expect(module.highlights.map((highlight) => highlight.id)).toEqual([
      'block-highlight-b',
      'block-highlight-a',
      'block-highlight-c',
    ]);
  });

  it('maps a row with an action', () => {
    const raw = makeRawFeatureHighlightsModule({
      highlights: [
        makeRawFeatureHighlightItem({
          action: makeRawCtaButton({ variant: CTA_ACTION_VARIANT.SECONDARY }),
        }),
      ],
    });

    const module = toFeatureHighlightsModule(raw);

    expect(module.highlights[0]?.action).toMatchObject({
      variant: CTA_ACTION_VARIANT.SECONDARY,
      link: { label: 'Subscribe', href: '/newsletter' },
    });
  });

  it('leaves a row action undefined when the row has none', () => {
    const raw = makeRawFeatureHighlightsModule({
      highlights: [makeRawFeatureHighlightItem({ action: null })],
    });

    const module = toFeatureHighlightsModule(raw);

    expect(module.highlights[0]?.action).toBeUndefined();
  });

  it('keeps a row whose action link cannot resolve, dropping only the action', () => {
    const raw = makeRawFeatureHighlightsModule({
      highlights: [
        makeRawFeatureHighlightItem({
          heading: 'Row with a broken action',
          action: makeRawCtaButton({
            link: {
              label: 'Broken',
              linkType: LINK_TYPE.INTERNAL,
              internalReference: null,
              url: null,
              openInNewTab: null,
            },
          }),
        }),
      ],
    });

    const module = toFeatureHighlightsModule(raw);

    expect(module.highlights[0]?.heading).toBe('Row with a broken action');
    expect(module.highlights[0]?.action).toBeUndefined();
  });

  it('returns an empty array for an absent ctaButtons field', () => {
    const raw = makeRawFeatureHighlightsModule({ ctaButtons: null });

    const module = toFeatureHighlightsModule(raw);

    expect(module.ctaButtons).toEqual([]);
  });

  it('maps authored ctaButtons', () => {
    const raw = makeRawFeatureHighlightsModule({
      ctaButtons: [makeRawCtaButton()],
    });

    const module = toFeatureHighlightsModule(raw);

    expect(module.ctaButtons).toHaveLength(1);
    expect(module.ctaButtons[0]).toMatchObject({
      link: { label: 'Subscribe', href: '/newsletter' },
    });
  });
});
