import { BRAND_VARIANT, HERO_FIELD_MODE } from '@blog/config';
import { MOCK_TOPIC_TITLE } from '@blog/service/testing/entities/fixtures';
import {
  MOCK_FEATURED_POST_ID,
  MOCK_HERO_EYEBROW,
  mockRawHeroModule,
} from '@blog/service/testing/modules/fixtures';
import { mockRawPostCard } from '@blog/service/testing/pages/fixtures';
import {
  MOCK_POST_HREF,
  MOCK_POST_TITLE,
  mockRawSanityImage,
  mockSanityImageView,
} from '@blog/service/testing/shared/fixtures';

import { toHeroModule } from './transformer';

const CUSTOM_COPY = {
  eyebrow: MOCK_HERO_EYEBROW,
  title: 'Custom home title',
  subtitle: 'Custom home subtitle.',
};

describe('toHeroModule', () => {
  let fallbackPost: ReturnType<typeof mockRawPostCard>;

  beforeEach(() => {
    fallbackPost = mockRawPostCard({ _id: 'fallback' });
  });

  it('maps brandVariant straight through', () => {
    const raw = mockRawHeroModule({
      brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
    });

    const hero = toHeroModule(raw, null);

    expect(hero.brandVariant).toBe(BRAND_VARIANT.BRAND_PRIMARY);
  });

  it('uses custom copy and custom sanity image when configured', () => {
    const raw = mockRawHeroModule({
      featuredPost: null,
      heroEyebrowMode: HERO_FIELD_MODE.CUSTOM,
      heroEyebrow: CUSTOM_COPY.eyebrow,
      heroTitleMode: HERO_FIELD_MODE.CUSTOM,
      heroTitle: CUSTOM_COPY.title,
      heroSubtitleMode: HERO_FIELD_MODE.CUSTOM,
      heroSubtitle: CUSTOM_COPY.subtitle,
      heroImageMode: HERO_FIELD_MODE.CUSTOM,
      heroImageAsset: mockRawSanityImage(),
    });

    const hero = toHeroModule(raw, null);

    expect(hero).toMatchObject(CUSTOM_COPY);
    expect(hero.sanityImage).toEqual(mockSanityImageView());
  });

  it('falls back to the featured post topic title when eyebrow mode is POST_TOPIC', () => {
    const raw = mockRawHeroModule({
      featuredPost: mockRawPostCard({ _id: MOCK_FEATURED_POST_ID }),
      heroEyebrowMode: HERO_FIELD_MODE.POST_TOPIC,
    });

    const hero = toHeroModule(raw, null);

    expect(hero.eyebrow).toBe(MOCK_TOPIC_TITLE);
  });

  it('hides the image when the mode is NONE, even with a fallback post', () => {
    const raw = mockRawHeroModule({
      featuredPost: null,
      heroImageMode: HERO_FIELD_MODE.NONE,
    });

    const hero = toHeroModule(raw, fallbackPost);

    expect(hero.sanityImage).toBeUndefined();
  });

  it('degrades gracefully when the featured post has no image', () => {
    const raw = mockRawHeroModule({
      featuredPost: mockRawPostCard({
        heroImage: null,
      }),
    });

    const hero = toHeroModule(raw, null);

    expect(hero.title).toBe(MOCK_POST_TITLE);
    expect(hero.sanityImage).toBeUndefined();
  });

  describe('with a configured featured post', () => {
    let raw: ReturnType<typeof mockRawHeroModule>;

    beforeEach(() => {
      raw = mockRawHeroModule({
        featuredPost: mockRawPostCard({ _id: MOCK_FEATURED_POST_ID }),
      });
    });

    it('uses the configured featured post as the fallback source', () => {
      const hero = toHeroModule(raw, null);

      expect(hero.title).toBe(MOCK_POST_TITLE);
      expect(hero.primaryAction).toEqual({
        label: 'Read more',
        href: MOCK_POST_HREF,
        target: undefined,
        platform: undefined,
        hiddenLabelSuffix: MOCK_POST_TITLE,
      });
    });

    it('leaves the primary action without an appearance', () => {
      const hero = toHeroModule(raw, null);

      expect(hero.primaryAction?.appearance).toBeUndefined();
    });
  });

  describe('with no configured featured post', () => {
    let raw: ReturnType<typeof mockRawHeroModule>;

    beforeEach(() => {
      raw = mockRawHeroModule({ featuredPost: null });
    });

    it('falls back to the newest featured post when none is configured', () => {
      const hero = toHeroModule(raw, fallbackPost);

      expect(hero.title).toBe(MOCK_POST_TITLE);
      expect(hero.primaryAction?.href).toBe(MOCK_POST_HREF);
      expect(hero.primaryAction?.hiddenLabelSuffix).toBe(MOCK_POST_TITLE);
    });

    it('has no primary action, title or subtitle when there is no post at all', () => {
      const hero = toHeroModule(raw, null);

      expect(hero.primaryAction).toBeUndefined();
      expect(hero.title).toBeUndefined();
      expect(hero.subtitle).toBeUndefined();
    });
  });
});
