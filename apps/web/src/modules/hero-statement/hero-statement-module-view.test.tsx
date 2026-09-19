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
  it('renders the heading as the top-level heading, labelling the Section via a unique id derived from the module id', () => {
    setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Build faster, ship sooner',
    });
    expect(heading).toBeVisible();
    expect(heading).toHaveAttribute('id', 'hero-statement-hero-statement-1');

    const section = heading.closest('section');
    expect(section).toHaveAttribute(
      'aria-labelledby',
      'hero-statement-hero-statement-1',
    );
  });
});
