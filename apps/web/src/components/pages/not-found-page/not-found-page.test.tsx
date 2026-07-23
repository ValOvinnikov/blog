import { customRender, screen } from '@web/testing/custom-render';

import { NotFoundPage } from './not-found-page';

const setup = customRender(NotFoundPage, {});

describe(`<${NotFoundPage.name}/>`, () => {
  beforeEach(() => {
    setup();
  });

  it('renders a single h1 landmark heading', () => {
    expect(
      screen.getByRole('heading', { level: 1, name: '404' }),
    ).toBeVisible();
  });

  it('renders the terminal-styled "command not found" copy', () => {
    expect(screen.getByText('404: command not found')).toBeVisible();
  });

  it('renders a link back home', () => {
    const link = screen.getByRole('link', { name: 'Return home' });
    expect(link).toHaveAttribute('href', '/');
  });
});
