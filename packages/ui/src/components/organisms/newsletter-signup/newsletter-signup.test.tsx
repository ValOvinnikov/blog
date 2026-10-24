import { customRender, screen } from '@blog/ui/testing/custom-render';
import { mockNewsletterSignupArgs } from '@blog/ui/testing/organisms/newsletter-signup/fixtures';
import { faker } from '@faker-js/faker';

import { NewsletterSignup } from './newsletter-signup';

faker.seed(123);

const baseArgs = {
  ...mockNewsletterSignupArgs(),
  heading: faker.lorem.sentence(3),
};

describe('NewsletterSignup', () => {
  it('wires Full to the rich density that renders the heading as a landmark', () => {
    const setup = customRender(NewsletterSignup.Full, baseArgs);
    setup();

    const heading = screen.getByRole('heading', { name: baseArgs.heading });

    expect(heading).toBeVisible();
  });

  it('wires Compact to the slim density with no heading landmark', () => {
    const setup = customRender(NewsletterSignup.Compact, baseArgs);
    setup();

    const heading = screen.queryByRole('heading');
    const label = screen.getByText(baseArgs.heading);

    expect(heading).not.toBeInTheDocument();
    expect(label).toBeVisible();
  });
});
