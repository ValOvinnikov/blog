import { NEWSLETTER_RESULT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';

import { NewsletterResultPage } from './newsletter-result-page';

const setup = customRender(NewsletterResultPage, {
  result: NEWSLETTER_RESULT.CONFIRMED,
});

describe(`<${NewsletterResultPage.name}/>`, () => {
  it('renders the confirmed result with a link home', () => {
    setup();

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Subscription confirmed',
    });
    const message = screen.getByText(
      'Your subscription is confirmed. Thanks for signing up!',
    );
    const homeLink = screen.getByRole('link', { name: 'Return home' });

    expect(heading).toBeVisible();
    expect(message).toBeVisible();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders the unsubscribe copy for an unsubscribe result', () => {
    setup({ result: NEWSLETTER_RESULT.UNSUBSCRIBE_INVALID });

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Link no longer valid',
    });
    const message = screen.getByText(
      'This unsubscribe link is no longer valid — you may already be unsubscribed.',
    );

    expect(heading).toBeVisible();
    expect(message).toBeVisible();
  });
});
