import { BRAND_VARIANT, HERO_VARIANT } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';
import { MOCK_HERO_BLOG_MODULE_ID } from '@web/testing/modules/hero-blog/fixtures';

import { HeroBlogModuleView } from './hero-blog-module-view';

faker.seed(6011);

const MOCK_HEADING = faker.lorem.words(3);

const setup = customRender(HeroBlogModuleView, {
  id: MOCK_HERO_BLOG_MODULE_ID,
  hasPost: true,
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  heading: MOCK_HEADING,
  supportingText: undefined,
  sanityImage: undefined,
  ctaButtons: [],
  contentPosition: undefined,
  contentAlignment: undefined,
  mediaOrder: undefined,
  layout: undefined,
});

describe(`<${HeroBlogModuleView.name}/>`, () => {
  it('names the section by its top-level heading', () => {
    setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: MOCK_HEADING,
    });
    const region = screen.getByRole('region', { name: MOCK_HEADING });

    expect(heading).toBeVisible();
    expect(region).toBeVisible();
  });

  it('gives two instances of the same module distinct heading ids', () => {
    setup();
    setup();

    const headings = screen.getAllByRole('heading', {
      level: 1,
      name: MOCK_HEADING,
    });
    const regions = screen.getAllByRole('region', { name: MOCK_HEADING });
    const headingIds = new Set(headings.map(({ id }) => id));

    expect(headingIds.size).toBe(headings.length);
    expect(regions).toHaveLength(headings.length);
  });
});
