import { BRAND_VARIANT, HERO_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_HERO_STATEMENT_HEADING,
  MOCK_HERO_STATEMENT_MODULE_ID,
} from '@web/testing/modules/hero-statement/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { HeroStatementModuleView } from './hero-statement-module-view';

const setup = customRender(HeroStatementModuleView, {
  id: MOCK_HERO_STATEMENT_MODULE_ID,
  brandVariant: BRAND_VARIANT.PRIMARY,
  variant: HERO_VARIANT.SPLIT,
  eyebrow: undefined,
  headingBlock: makeHeadingBlock({ heading: MOCK_HERO_STATEMENT_HEADING }),
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

    const heading = screen.getByRole('heading', {
      level: 1,
      name: MOCK_HERO_STATEMENT_HEADING,
    });
    const region = screen.getByRole('region', {
      name: MOCK_HERO_STATEMENT_HEADING,
    });
    expect(heading).toBeVisible();
    expect(region).toBeVisible();
  });

  it('gives two instances of the same module distinct heading ids', () => {
    setup();
    setup();

    const headingIds = screen
      .getAllByRole('heading', {
        level: 1,
        name: MOCK_HERO_STATEMENT_HEADING,
      })
      .map(({ id }) => id);
    const regions = screen.getAllByRole('region', {
      name: MOCK_HERO_STATEMENT_HEADING,
    });
    expect(new Set(headingIds).size).toBe(2);
    expect(regions).toHaveLength(2);
  });
});
