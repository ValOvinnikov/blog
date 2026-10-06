import { customRender, screen, within } from '@web/testing/custom-render';
import {
  makeChildPageCard,
  makeChildPagesModule,
} from '@web/testing/modules/child-pages/fixtures';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';

import { ChildPagesModuleView } from './child-pages-module-view';

vi.mock('@web/i18n/navigation');

const setup = customRender(ChildPagesModuleView, {
  ...makeChildPagesModule(),
  titleId: 'child-pages-title',
  dataTestId: 'child-pages-module-child-pages-1',
});

describe(`<${ChildPagesModuleView.name}/>`, () => {
  it('labels the section with its heading', () => {
    setup();

    expect(
      screen.getByRole('region', { name: 'In this section' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { level: 2, name: 'In this section' }),
    ).toBeVisible();
  });

  it('renders a card per child page in the given order, each linking to its full path', () => {
    setup({
      pages: [
        makeChildPageCard({
          id: 'pricing',
          title: 'Pricing',
          path: 'modules/pricing',
        }),
        makeChildPageCard({ id: 'faq', title: 'FAQ', path: 'modules/faq' }),
      ],
    });

    const links = screen.getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Pricing', 'FAQ']);
    expect(links[0]).toHaveAttribute('href', '/modules/pricing');
    expect(links[1]).toHaveAttribute('href', '/modules/faq');
  });

  it('renders each card title one level below the module heading', () => {
    setup();

    expect(
      screen.getByRole('heading', { level: 3, name: 'FAQ' }),
    ).toBeVisible();
  });

  it('renders the child page summary', () => {
    setup();

    const card = screen.getByRole('article');
    expect(
      within(card).getByText('Answers to the questions we hear most.'),
    ).toBeVisible();
  });

  it('renders card titles as the top-level heading when the module has no heading', () => {
    setup({ headingBlock: undefined });

    expect(
      screen.getByRole('heading', { level: 2, name: 'FAQ' }),
    ).toBeVisible();
    expect(screen.getAllByRole('heading')).toHaveLength(1);
  });

  it('renders the child page image when it has one', () => {
    const image = makeSanityImage();
    setup({ pages: [makeChildPageCard({ image })] });

    expect(screen.getByRole('img', { name: image.alt })).toBeVisible();
  });

  it('renders no media region when the child page has no image', () => {
    setup();

    expect(
      screen.queryByTestId('child-page-card-media'),
    ).not.toBeInTheDocument();
  });
});
