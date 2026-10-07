import { customRender, screen, within } from '@web/testing/custom-render';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import {
  makeSectionPageCard,
  makeSectionPagesModule,
} from '@web/testing/modules/section-pages/fixtures';

import { SectionPagesModuleView } from './section-pages-module-view';

vi.mock('@web/i18n/navigation');

const setup = customRender(SectionPagesModuleView, {
  ...makeSectionPagesModule(),
  titleId: 'section-pages-title',
  dataTestId: 'section-pages-module-section-pages-1',
});

describe(`<${SectionPagesModuleView.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the section with its heading', () => {
      expect(
        screen.getByRole('region', { name: 'In this section' }),
      ).toBeVisible();
      expect(
        screen.getByRole('heading', { level: 2, name: 'In this section' }),
      ).toBeVisible();
    });

    it('renders each card title one level below the module heading', () => {
      expect(
        screen.getByRole('heading', { level: 3, name: 'FAQ' }),
      ).toBeVisible();
    });

    it('renders the section page summary', () => {
      const card = screen.getByRole('article');
      expect(
        within(card).getByText('Answers to the questions we hear most.'),
      ).toBeVisible();
    });

    it('renders no media region when the section page has no image', () => {
      expect(
        screen.queryByTestId('section-page-card-media'),
      ).not.toBeInTheDocument();
    });
  });

  it('renders a card per section page in the given order, each linking to its full path', () => {
    setup({
      pages: [
        makeSectionPageCard({
          id: 'pricing',
          title: 'Pricing',
          path: 'modules/pricing',
        }),
        makeSectionPageCard({ id: 'faq', title: 'FAQ', path: 'modules/faq' }),
      ],
    });

    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Pricing', 'FAQ']);
    expect(links[0]).toHaveAttribute('href', '/modules/pricing');
    expect(links[1]).toHaveAttribute('href', '/modules/faq');
  });

  it('renders card titles as the top-level heading when the module has no heading', () => {
    setup({ headingBlock: undefined });

    expect(
      screen.getByRole('heading', { level: 2, name: 'FAQ' }),
    ).toBeVisible();
    expect(screen.getAllByRole('heading')).toHaveLength(1);
  });

  it('renders the section page image when it has one', () => {
    const image = makeSanityImage();
    setup({ pages: [makeSectionPageCard({ image })] });

    expect(screen.getByRole('img', { name: image.alt })).toBeVisible();
  });
});
