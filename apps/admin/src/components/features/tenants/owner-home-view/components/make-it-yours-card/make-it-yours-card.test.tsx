import { renderWithIntl, screen } from '@admin/testing/custom-render';

import { MakeItYoursCard } from './make-it-yours-card';

const render = renderWithIntl;

describe(MakeItYoursCard, () => {
  it('links to Look, Voice and Features', () => {
    render(<MakeItYoursCard />);

    expect(screen.getByRole('link', { name: /Look/ })).toHaveAttribute(
      'href',
      '/dashboard/look',
    );
    expect(screen.getByRole('link', { name: /Voice/ })).toHaveAttribute(
      'href',
      '/dashboard/voice',
    );
    expect(screen.getByRole('link', { name: /Features/ })).toHaveAttribute(
      'href',
      '/dashboard/features',
    );
  });

  it("nests the card's title one level under the page's own h1", () => {
    render(<MakeItYoursCard />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Make it yours' }),
    ).toBeVisible();
  });
});
