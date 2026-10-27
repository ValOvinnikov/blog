import type { TModule } from '@blog/service';
import { faker } from '@faker-js/faker';

export const MOCK_POST_LIST_ID = faker.string.uuid();

export const MOCK_HERO_STUB_TEST_ID = 'stub-hero';

export const MOCK_CTA_STUB_TEST_ID = 'stub-cta';

export const MOCK_CONTENT_STUB_TEST_ID = 'stub-content';

export const MOCK_NEWSLETTER_STUB_TEST_ID = 'stub-newsletter';

export const MOCK_POST_LATEST_STUB_TEST_ID = 'stub-post-latest';

export const MOCK_POST_LIST_STUB_TEST_ID = 'stub-post-list';

export const MOCK_POST_FEATURED_STUB_TEST_ID = 'stub-post-featured';

export const MOCK_TAXONOMY_LIST_STUB_TEST_ID = 'stub-taxonomy-list';

export const MOCK_HERO_STATEMENT_STUB_TEST_ID = 'stub-hero-statement';

export const MOCK_HERO_PROFILE_STUB_TEST_ID = 'stub-hero-profile';

export const MOCK_FEATURE_LIST_STUB_TEST_ID = 'stub-feature-list';

export const MOCK_TESTIMONIAL_STUB_TEST_ID = 'stub-testimonial';

export const MOCK_FAQ_STUB_TEST_ID = 'stub-faq';

export const MOCK_SECTION_PAGES_STUB_TEST_ID = 'stub-section-pages';

export const MOCK_POST_RELATED_STUB_TEST_ID = 'stub-post-related';

export const MOCK_CHILDREN_STUB_TEST_ID = 'stub-children';

export const mockModule = <T extends TModule['type']>(
  type: T,
  overrides: Partial<TModule<T>> = {},
): TModule<T> => ({ id: faker.string.uuid(), type, ...overrides });
