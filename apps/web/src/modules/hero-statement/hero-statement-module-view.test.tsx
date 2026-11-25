import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_HERO_STATEMENT_FOOTNOTE,
  MOCK_HERO_STATEMENT_HEADING,
  MOCK_HERO_STATEMENT_MODULE_ID,
  mockHeroStatementModule,
} from '@web/testing/modules/hero-statement/fixtures';

import { HeroStatementModuleView } from './hero-statement-module-view';

const setup = customRender(HeroStatementModuleView, {
  id: MOCK_HERO_STATEMENT_MODULE_ID,
  module: mockHeroStatementModule(),
});

describe(`<${HeroStatementModuleView.name}/>`, () => {
  describe('with the default module data', () => {
    beforeEach(() => {
      setup();
    });

    it('names the section by its top-level heading', () => {
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

    it('renders no footnote', () => {
      const footnote = screen.queryByText(MOCK_HERO_STATEMENT_FOOTNOTE);

      expect(footnote).not.toBeInTheDocument();
    });
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

  it('renders the footnote when set', () => {
    setup({
      module: mockHeroStatementModule({
        footnote: MOCK_HERO_STATEMENT_FOOTNOTE,
      }),
    });

    const footnote = screen.getByText(MOCK_HERO_STATEMENT_FOOTNOTE);

    expect(footnote).toBeVisible();
  });
});
