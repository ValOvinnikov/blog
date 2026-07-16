import { HERO_FIELD_MODE } from '@blog/config';
import { makeRawHeroModule } from '@blog/service/testing/modules/fixtures';
import { makeRawPostCard } from '@blog/service/testing/pages/fixtures';
import { makeRawSanityImage } from '@blog/service/testing/shared/fixtures';
import { describe, expect, it } from 'vitest';

import { toHeroModule } from './transformer';

describe('toHeroModule', () => {
  it('uses the configured featured post as the fallback source', () => {
    const raw = makeRawHeroModule({
      featuredPost: makeRawPostCard({ _id: 'featured-ref' }),
    });

    const hero = toHeroModule(raw, null);

    expect(hero.title).toBe('Hello World');
    expect(hero.primaryAction).toEqual({
      label: 'Read more',
      href: '/blog/hello-world',
      target: undefined,
      platform: undefined,
    });
  });

  it('falls back to the newest featured post when none is configured', () => {
    const raw = makeRawHeroModule({ featuredPost: null });
    const fallbackPost = makeRawPostCard({ _id: 'fallback' });

    const hero = toHeroModule(raw, fallbackPost);

    expect(hero.title).toBe('Hello World');
    expect(hero.primaryAction?.href).toBe('/blog/hello-world');
  });

  it('uses custom copy and custom image when configured', () => {
    const raw = makeRawHeroModule({
      featuredPost: null,
      heroEyebrowMode: HERO_FIELD_MODE.CUSTOM,
      heroEyebrow: 'Field notes',
      heroTitleMode: HERO_FIELD_MODE.CUSTOM,
      heroTitle: 'Custom home title',
      heroSubtitleMode: HERO_FIELD_MODE.CUSTOM,
      heroSubtitle: 'Custom home subtitle.',
      heroImageMode: HERO_FIELD_MODE.CUSTOM,
      heroImage: makeRawPostCard().mainImage,
      heroImageAsset: makeRawSanityImage(),
    });

    const hero = toHeroModule(raw, null);

    expect(hero.eyebrow).toBe('Field notes');
    expect(hero.title).toBe('Custom home title');
    expect(hero.subtitle).toBe('Custom home subtitle.');
    expect(hero.image?.src).toContain('cdn.sanity.io');
    expect(hero.image?.alt).toBe('Alt text');
    expect(hero.sanityImage).toEqual({
      assetId: 'image-abc123-800x600-jpg',
      alt: 'Alt text',
      hotspot: undefined,
      crop: undefined,
      lqip: 'data:image/png;base64,abc123',
      dimensions: { width: 800, height: 600, aspectRatio: 1.333 },
    });
  });

  it('hides the image when the mode is NONE, even with a fallback post', () => {
    const raw = makeRawHeroModule({
      featuredPost: null,
      heroImageMode: HERO_FIELD_MODE.NONE,
    });
    const fallbackPost = makeRawPostCard({ _id: 'fallback' });

    const hero = toHeroModule(raw, fallbackPost);

    expect(hero.image).toBeUndefined();
    expect(hero.sanityImage).toBeUndefined();
  });

  it('degrades gracefully when the featured post has no image', () => {
    const raw = makeRawHeroModule({
      featuredPost: makeRawPostCard({
        mainImage: null,
        mainImageAsset: null,
      }),
    });

    const hero = toHeroModule(raw, null);

    expect(hero.title).toBe('Hello World');
    expect(hero.image).toBeUndefined();
    expect(hero.sanityImage).toBeUndefined();
  });

  it('has no primary action and undefined title/subtitle when there is no post at all', () => {
    const raw = makeRawHeroModule({ featuredPost: null });

    const hero = toHeroModule(raw, null);

    expect(hero.primaryAction).toBeUndefined();
    expect(hero.title).toBeUndefined();
    expect(hero.subtitle).toBeUndefined();
  });
});
