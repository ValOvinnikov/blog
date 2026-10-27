import { NEWSLETTER_RESULT, routes, SITE_MESSAGES } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';

import { NewsletterResultPage } from './newsletter-result-page';

const { newsletterConfirm, newsletterUnsubscribe } = SITE_MESSAGES;

const setup = customRender(NewsletterResultPage, {
  result: NEWSLETTER_RESULT.CONFIRMED,
});

describe(`<${NewsletterResultPage.name}/>`, () => {
  it.each([
    [
      NEWSLETTER_RESULT.CONFIRMED,
      newsletterConfirm.confirmedTitle,
      newsletterConfirm.confirmedMessage,
    ],
    [
      NEWSLETTER_RESULT.UNSUBSCRIBE_INVALID,
      newsletterUnsubscribe.invalidTitle,
      newsletterUnsubscribe.invalidMessage,
    ],
  ])('renders the copy for the %s result', (result, title, message) => {
    setup({ result });

    const heading = screen.getByRole('heading', { level: 1, name: title });
    const messageText = screen.getByText(message);

    expect(heading).toBeVisible();
    expect(messageText).toBeVisible();
  });

  it('links back home', () => {
    setup();

    const homeLink = screen.getByRole('link', {
      name: newsletterConfirm.returnHome,
    });

    expect(homeLink).toHaveAttribute('href', routes.home());
  });
});
