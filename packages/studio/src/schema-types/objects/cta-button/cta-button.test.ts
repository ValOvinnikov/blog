import {
  CTA_ACTION_APPEARANCE,
  CTA_ACTION_VARIANT,
} from '@blog/config/constants';
import {
  ctaButtonSchema,
  ctaSecondaryButtonSchema,
} from '@blog/studio/schema-types/objects/cta-button/cta-button';

describe('ctaButtonSchema preview', () => {
  const prepare = ctaButtonSchema.preview?.prepare;

  it.each([
    [
      {
        variant: CTA_ACTION_VARIANT.PRIMARY,
        appearance: CTA_ACTION_APPEARANCE.CONTAINED,
        url: 'https://example.com/start',
        pageType: undefined,
        pageSlug: undefined,
      },
      { title: 'Primary · Contained', subtitle: 'https://example.com/start' },
    ],
    [
      {
        variant: CTA_ACTION_VARIANT.PRIMARY,
        appearance: CTA_ACTION_APPEARANCE.INLINE,
        url: undefined,
        pageType: 'page_post',
        pageSlug: 'hello-world',
      },
      { title: 'Primary · Inline', subtitle: '/blog/hello-world' },
    ],
    [
      {
        variant: CTA_ACTION_VARIANT.SECONDARY,
        appearance: CTA_ACTION_APPEARANCE.INLINE,
        url: undefined,
        pageType: undefined,
        pageSlug: undefined,
      },
      { title: 'Secondary · Inline', subtitle: 'No link yet' },
    ],
  ])('prepares %j', (input, expected) => {
    expect(prepare?.(input)).toEqual(expected);
  });
});

describe('ctaSecondaryButtonSchema preview', () => {
  const prepare = ctaSecondaryButtonSchema.preview?.prepare;

  it('titles by variant and appearance, subtitles by the URL', () => {
    expect(
      prepare?.({
        variant: CTA_ACTION_VARIANT.SECONDARY,
        appearance: CTA_ACTION_APPEARANCE.CONTAINED,
        url: undefined,
        pageType: 'page_home',
        pageSlug: undefined,
      }),
    ).toEqual({ title: 'Secondary · Contained', subtitle: '/' });
  });
});
