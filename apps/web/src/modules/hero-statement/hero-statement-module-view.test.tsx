import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_HERO_STATEMENT_HEADING,
  MOCK_HERO_STATEMENT_MODULE_ID,
  mockHeroStatementModule,
} from '@web/testing/modules/hero-statement/fixtures';

import { HeroStatementModuleView } from './hero-statement-module-view';

const setup = customRender(HeroStatementModuleView, {
  id: MOCK_HERO_STATEMENT_MODULE_ID,
  ...mockHeroStatementModule(),
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

    const headings = screen.getAllByRole('heading', {
      level: 1,
      name: MOCK_HERO_STATEMENT_HEADING,
    });
    const regions = screen.getAllByRole('region', {
      name: MOCK_HERO_STATEMENT_HEADING,
    });
    const headingIds = headings.map(({ id }) => id);

    expect(new Set(headingIds).size).toBe(2);
    expect(regions).toHaveLength(2);
  });
});
