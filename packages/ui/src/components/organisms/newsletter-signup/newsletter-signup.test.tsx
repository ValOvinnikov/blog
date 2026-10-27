import { customRender, screen } from '@blog/ui/testing/custom-render';
import { mockNewsletterSignupArgs } from '@blog/ui/testing/organisms/newsletter-signup/fixtures';
import { faker } from '@faker-js/faker';

import { NewsletterSignup } from './newsletter-signup';

faker.seed(123);

const MOCK_HEADING = faker.lorem.sentence(3);

const baseArgs = {
  ...mockNewsletterSignupArgs(),
  heading: MOCK_HEADING,
};

const setupFull = customRender(NewsletterSignup.Full, baseArgs);
const setupCompact = customRender(NewsletterSignup.Compact, baseArgs);

describe('NewsletterSignup', () => {
  it('wires Full to the density that renders the heading as a landmark', () => {
    setupFull();

    const heading = screen.getByRole('heading', { name: MOCK_HEADING });

    expect(heading).toBeVisible();
  });

  it('wires Compact to the slim density with no heading landmark', () => {
    setupCompact();

    const heading = screen.queryByRole('heading', { name: MOCK_HEADING });
    const label = screen.getByText(MOCK_HEADING);

    expect(heading).not.toBeInTheDocument();
    expect(label).toBeVisible();
  });
});
