import { customRender, screen, within } from '@web/testing/custom-render';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import {
  MOCK_SECTION_PAGES_HEADING,
  MOCK_SECTION_PAGE_TITLE,
  mockSectionPageCard,
  mockSectionPagesModule,
} from '@web/testing/modules/section-pages/fixtures';

import { SectionPagesModuleView } from './section-pages-module-view';

vi.mock('@web/i18n/navigation');

const setup = customRender(SectionPagesModuleView, {
  ...mockSectionPagesModule(),
  titleId: 'section-pages-title',
  dataTestId: 'section-pages-module-section-pages-1',
});

describe(`<${SectionPagesModuleView.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the section with its heading', () => {
      const section = screen.getByRole('region', {
        name: MOCK_SECTION_PAGES_HEADING,
      });
      const heading = screen.getByRole('heading', {
        level: 2,
        name: MOCK_SECTION_PAGES_HEADING,
      });
      expect(section).toBeVisible();
      expect(heading).toBeVisible();
    });

    it('renders each card title one level below the module heading', () => {
      const cardTitle = screen.getByRole('heading', {
        level: 3,
        name: MOCK_SECTION_PAGE_TITLE,
      });
      expect(cardTitle).toBeVisible();
    });

    it('renders the section page summary', () => {
      const card = screen.getByRole('article');
      const summary = within(card).getByText(
        'Answers to the questions we hear most.',
      );
      expect(summary).toBeVisible();
    });

    it('renders no media region when the section page has no image', () => {
      const media = screen.queryByTestId('section-page-card-media');
      expect(media).not.toBeInTheDocument();
    });
  });

  it('renders a card per section page in order, linking to its full path', () => {
    setup({
      pages: [
        mockSectionPageCard({
          id: 'pricing',
          title: 'Pricing',
          path: 'modules/pricing',
        }),
        mockSectionPageCard(),
      ],
    });

    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual([
      'Pricing',
      MOCK_SECTION_PAGE_TITLE,
    ]);
    expect(links[0]).toHaveAttribute('href', '/modules/pricing');
    expect(links[1]).toHaveAttribute('href', '/modules/faq');
  });

  it('renders card titles as the top-level heading when the module has no heading', () => {
    setup({ headingBlock: undefined });

    const cardTitle = screen.getByRole('heading', {
      level: 2,
      name: MOCK_SECTION_PAGE_TITLE,
    });
    const headings = screen.getAllByRole('heading');
    expect(cardTitle).toBeVisible();
    expect(headings).toHaveLength(1);
  });

  it('renders the section page image when it has one', () => {
    const image = mockSanityImage();
    setup({ pages: [mockSectionPageCard({ image })] });

    const renderedImage = screen.getByRole('img', { name: image.alt });
    expect(renderedImage).toBeVisible();
  });
});
