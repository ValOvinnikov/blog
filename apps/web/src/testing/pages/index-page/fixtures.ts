import { CONTENT_ALIGNMENT, LOCALE_ISO_CODES } from '@blog/config';
import type { TBlogIndexPage } from '@blog/service';
import { faker } from '@faker-js/faker';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { mockSeo } from '@web/testing/shared/seo/fixtures';

type TIndexPageBase = Omit<TBlogIndexPage, 'hero' | 'modules'>;

export const mockIndexPage = (
  overrides: Partial<TIndexPageBase> = {},
): TIndexPageBase & { hero: undefined; modules: never[] } => ({
  headingAlignment: CONTENT_ALIGNMENT.LEFT,
  headingBlock: mockHeadingBlock({
    heading: faker.lorem.words(2),
    supportingText: faker.lorem.sentence(),
  }),
  hero: undefined,
  modules: [],
  seo: mockSeo(),
  translations: [LOCALE_ISO_CODES.EN],
  ...overrides,
});
