import { customRender, screen, within } from '@web/testing/custom-render';

import { NotFoundPage } from './not-found-page';

const setup = customRender(NotFoundPage, {});

describe(`<${NotFoundPage.name}/>`, () => {
  beforeEach(() => {
    setup();
  });

  it('renders the eyebrow', () => {
    expect(screen.getByText('404')).toBeVisible();
  });

  it('renders a single h1 landmark heading', () => {
    expect(
      screen.getByRole('heading', { level: 1, name: 'Page not found' }),
    ).toBeVisible();
  });

  it('renders the supporting text', () => {
    expect(
      screen.getByText("The page you're looking for doesn't exist."),
    ).toBeVisible();
  });

  it('renders a link back home', () => {
    const link = screen.getByRole('link', { name: 'Return home' });
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders the decorative arrow icon inside the link', () => {
    const link = screen.getByRole('link', { name: 'Return home' });
    expect(
      within(link).getByTestId('not-found-arrow-icon'),
    ).toBeInTheDocument();
  });
});
