import { FORM_STATUS } from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { NewsletterSignup } from './newsletter-signup';

faker.seed(123);

const SUBMIT_LABEL = faker.lorem.word();
const EMAIL_LABEL = faker.lorem.words(2);

const baseArgs = {
  email: '',
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  status: FORM_STATUS.IDLE,
  heading: faker.lorem.sentence(3),
  submitLabel: SUBMIT_LABEL,
  emailAriaLabel: EMAIL_LABEL,
};

describe('NewsletterSignup', () => {
  it('wires Full to the rich density that renders the heading as a landmark', () => {
    const setup = customRender(NewsletterSignup.Full, baseArgs);
    setup();

    expect(
      screen.getByRole('heading', { name: baseArgs.heading }),
    ).toBeVisible();
  });

  it('wires Compact to the slim density with no heading landmark', () => {
    const setup = customRender(NewsletterSignup.Compact, baseArgs);
    setup();

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.getByText(baseArgs.heading)).toBeVisible();
  });
});
