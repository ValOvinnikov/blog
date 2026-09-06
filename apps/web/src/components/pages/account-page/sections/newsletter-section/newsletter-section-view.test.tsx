import { customRender, screen } from '@web/testing/custom-render';
import { makeNewsletterSectionView } from '@web/testing/pages/account-page/newsletter-section-fixtures';

import { NewsletterSectionView } from './newsletter-section-view';

const setup = customRender(NewsletterSectionView, makeNewsletterSectionView());

describe(NewsletterSectionView, () => {
  it('renders the panel heading as a level-2 heading', () => {
    setup();

    expect(
      screen.getByRole('heading', { level: 2, name: 'Newsletter' }),
    ).toBeVisible();
  });

  it('renders the active state with the subscribed badge, email, and given control', () => {
    setup();

    expect(screen.getByText('Subscribed')).toBeVisible();
    expect(screen.getByText('jane@example.com')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Unsubscribe' })).toBeVisible();
  });

  it('renders the pending state with the pending badge, no email, and given control', () => {
    setup({
      status: 'pending',
      control: <button type="button">Resend</button>,
    });

    expect(screen.getByText('Pending confirmation')).toBeVisible();
    expect(
      screen.getByText(
        "The double-opt-in link hasn't been clicked yet. Resend it if it never arrived.",
      ),
    ).toBeVisible();
    expect(screen.queryByText('jane@example.com')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Resend' })).toBeVisible();
  });
});
