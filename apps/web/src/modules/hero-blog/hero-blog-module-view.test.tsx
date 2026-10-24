import { BRAND_VARIANT, HERO_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { MOCK_HERO_BLOG_MODULE_ID } from '@web/testing/modules/hero-blog/fixtures';

import { HeroBlogModuleView } from './hero-blog-module-view';

const HEADING = 'Welcome to the blog';

const setup = customRender(HeroBlogModuleView, {
  id: MOCK_HERO_BLOG_MODULE_ID,
  hasPost: true,
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  heading: HEADING,
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
      name: HEADING,
    });
    const region = screen.getByRole('region', { name: HEADING });
    expect(heading).toBeVisible();
    expect(region).toBeVisible();
  });

  it('gives two instances of the same module distinct heading ids', () => {
    setup();
    setup();

    const headingIds = screen
      .getAllByRole('heading', {
        level: 1,
        name: HEADING,
      })
      .map(({ id }) => id);
    const regions = screen.getAllByRole('region', {
      name: HEADING,
    });
    expect(new Set(headingIds).size).toBe(2);
    expect(regions).toHaveLength(2);
  });
});
