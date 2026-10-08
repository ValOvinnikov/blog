import { BRAND_VARIANT, HERO_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';

import { HeroBlogModuleView } from './hero-blog-module-view';

const setup = customRender(HeroBlogModuleView, {
  id: 'hero-blog-1',
  hasPost: true,
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  heading: 'Welcome to the blog',
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

    expect(
      screen.getByRole('heading', { level: 1, name: 'Welcome to the blog' }),
    ).toBeVisible();
    expect(
      screen.getByRole('region', { name: 'Welcome to the blog' }),
    ).toBeVisible();
  });

  it('gives two instances of the same module distinct heading ids', () => {
    setup();
    setup();

    const headingIds = screen
      .getAllByRole('heading', {
        level: 1,
        name: 'Welcome to the blog',
      })
      .map(({ id }) => id);
    expect(new Set(headingIds).size).toBe(2);
    expect(
      screen.getAllByRole('region', { name: 'Welcome to the blog' }),
    ).toHaveLength(2);
  });
});
