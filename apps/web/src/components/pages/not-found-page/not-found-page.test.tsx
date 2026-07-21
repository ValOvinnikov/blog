import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NotFoundPage } from './not-found-page';

describe(`<${NotFoundPage.name}/>`, () => {
  it('renders a single h1 landmark heading', () => {
    render(<NotFoundPage />);

    expect(
      screen.getByRole('heading', { level: 1, name: '404' }),
    ).toBeVisible();
  });

  it('renders the terminal-styled "command not found" copy', () => {
    render(<NotFoundPage />);

    expect(screen.getByText('404: command not found')).toBeVisible();
  });

  it('renders a link back home', () => {
    render(<NotFoundPage />);

    const link = screen.getByRole('link', { name: 'Return home' });
    expect(link).toHaveAttribute('href', '/');
  });
});
