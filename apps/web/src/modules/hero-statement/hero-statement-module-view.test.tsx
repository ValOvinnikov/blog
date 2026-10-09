import { BRAND_VARIANT, HERO_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { HeroStatementModuleView } from './hero-statement-module-view';

const setup = customRender(HeroStatementModuleView, {
  id: 'hero-statement-1',
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  headingBlock: makeHeadingBlock({ heading: 'Build faster, ship sooner' }),
  sanityImage: undefined,
  ctaButtons: [],
  contentPosition: undefined,
  contentAlignment: undefined,
  mediaOrder: undefined,
  layout: undefined,
});

describe(`<${HeroStatementModuleView.name}/>`, () => {
  it('names the section by its top-level heading', () => {
    setup();

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Build faster, ship sooner',
      }),
    ).toBeVisible();
    expect(
      screen.getByRole('region', { name: 'Build faster, ship sooner' }),
    ).toBeVisible();
  });

  it('gives two instances of the same module distinct heading ids', () => {
    setup();
    setup();

    const headingIds = screen
      .getAllByRole('heading', {
        level: 1,
        name: 'Build faster, ship sooner',
      })
      .map(({ id }) => id);
    expect(new Set(headingIds).size).toBe(2);
    expect(
      screen.getAllByRole('region', { name: 'Build faster, ship sooner' }),
    ).toHaveLength(2);
  });
});
