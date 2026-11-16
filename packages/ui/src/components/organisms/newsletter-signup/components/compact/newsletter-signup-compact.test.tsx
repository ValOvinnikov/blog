import { NEWSLETTER_VARIANT } from '@shinefold/config';
import { customRender, screen } from '@shinefold/ui/testing/custom-render';
import {
  MOCK_NEWSLETTER_EMAIL_LABEL,
  makeNewsletterSignupForm,
} from '@shinefold/ui/testing/organisms/newsletter-signup/fixtures';

import { NewsletterSignupCompact } from './newsletter-signup-compact';

const setup = customRender(NewsletterSignupCompact, {
  children: makeNewsletterSignupForm({ variant: NEWSLETTER_VARIANT.COMPACT }),
});

describe(`<${NewsletterSignupCompact.name}/>`, () => {
  it('renders the form it holds with no heading of its own', () => {
    setup();

    const emailField = screen.getByRole('textbox', {
      name: MOCK_NEWSLETTER_EMAIL_LABEL,
    });
    const heading = screen.queryByRole('heading');

    expect(emailField).toBeVisible();
    expect(heading).not.toBeInTheDocument();
  });
});
