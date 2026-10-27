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
import { faker } from '@faker-js/faker';

import { toHeroModule } from './transformer';

faker.seed(6014);

const MOCK_FALLBACK_POST_ID = faker.string.uuid();

const MOCK_CUSTOM_COPY = {
  eyebrow: MOCK_HERO_EYEBROW,
  title: faker.lorem.words(3),
  subtitle: faker.lorem.sentence(),
};

describe(toHeroModule, () => {
  let fallbackPost: ReturnType<typeof mockRawPostCard>;

  beforeEach(() => {
    fallbackPost = mockRawPostCard({ _id: MOCK_FALLBACK_POST_ID });
  });

  it('keeps the authored brand variant', () => {
    const raw = mockRawHeroModule({
      brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
    });

    const hero = toHeroModule(raw, null);

    expect(hero.brandVariant).toBe(BRAND_VARIANT.BRAND_PRIMARY);
  });

  it('uses the custom copy and image when configured', () => {
    const raw = mockRawHeroModule({
      featuredPost: null,
      heroEyebrowMode: HERO_FIELD_MODE.CUSTOM,
      heroEyebrow: MOCK_CUSTOM_COPY.eyebrow,
      heroTitleMode: HERO_FIELD_MODE.CUSTOM,
      heroTitle: MOCK_CUSTOM_COPY.title,
      heroSubtitleMode: HERO_FIELD_MODE.CUSTOM,
      heroSubtitle: MOCK_CUSTOM_COPY.subtitle,
      heroImageMode: HERO_FIELD_MODE.CUSTOM,
      heroImageAsset: mockRawSanityImage(),
    });

    const hero = toHeroModule(raw, null);

    const { eyebrow, title, subtitle } = hero;

    expect({ eyebrow, title, subtitle }).toEqual(MOCK_CUSTOM_COPY);
    expect(hero.sanityImage).toEqual(mockSanityImageView());
  });

  it('takes the eyebrow from the featured post topic in post-topic mode', () => {
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
      expect(hero.primaryAction?.href).toBe(MOCK_POST_HREF);
      expect(hero.primaryAction?.hiddenLabelSuffix).toBe(MOCK_POST_TITLE);
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

    it('has no primary action, title or subtitle without any post', () => {
      const hero = toHeroModule(raw, null);

      expect(hero.primaryAction).toBeUndefined();
      expect(hero.title).toBeUndefined();
      expect(hero.subtitle).toBeUndefined();
    });
  });
});
