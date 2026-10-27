import { ACTION_OUTCOME } from '@blog/config';
import { faker } from '@faker-js/faker';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import { NEWSLETTER_OUTCOME } from '@web/constants/newsletter';
import type { TSubscribeResult } from '@web/server/newsletter/newsletter-actions/newsletter-actions';
import {
  customRender,
  renderElement,
  screen,
  waitFor,
} from '@web/testing/custom-render';

import { NewsletterForm } from './newsletter-form';

const { subscribeToNewsletterActionMock } = vi.hoisted(() => ({
  subscribeToNewsletterActionMock: vi.fn(),
}));

vi.mock('@web/server/newsletter/newsletter-actions/newsletter-actions', () => ({
  subscribeToNewsletterAction: subscribeToNewsletterActionMock,
}));

const setup = customRender(NewsletterForm, {
  variant: 'full' as const,
});

faker.seed(6007);

const MOCK_EMAIL = faker.internet.email();
const MOCK_MALFORMED_EMAIL = faker.lorem.word();
const MOCK_EXTRA_CHARACTER = faker.string.alpha(1);
const MOCK_CONTENT = faker.lorem.sentences(2);
const MOCK_FIRST_TRUST_CUE = faker.lorem.words(2);
const MOCK_SECOND_TRUST_CUE = faker.lorem.words(3);

const EMAIL_FIELD_NAME = 'Email address';
const SUBSCRIBE_BUTTON_NAME = 'Subscribe';
const DESCRIBED_BY_ATTRIBUTE = 'aria-describedby';
const SUCCESS_MESSAGE = 'Almost there — check your inbox to confirm.';
const INVALID_EMAIL_MESSAGE = 'Enter a valid email address.';

const typeAndSubmit = async (user: UserEvent, typedEmail: string) => {
  const emailField = screen.getByRole('textbox', { name: EMAIL_FIELD_NAME });
  const subscribeButton = screen.getByRole('button', {
    name: SUBSCRIBE_BUTTON_NAME,
  });

  await user.type(emailField, typedEmail);
  await user.click(subscribeButton);
};

describe(`<${NewsletterForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
  });

  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders idle with a labeled field and submit button', () => {
      const emailField = screen.getByRole('textbox', {
        name: EMAIL_FIELD_NAME,
      });
      const subscribeButton = screen.getByRole('button', {
        name: SUBSCRIBE_BUTTON_NAME,
      });

      expect(emailField).toBeVisible();
      expect(subscribeButton).toBeVisible();
    });

    it('rejects a malformed email without calling the server action', async () => {
      await typeAndSubmit(user, MOCK_MALFORMED_EMAIL);

      const alert = await screen.findByRole('alert');

      expect(alert).toHaveTextContent(INVALID_EMAIL_MESSAGE);
      expect(subscribeToNewsletterActionMock).not.toHaveBeenCalled();
    });

    it('marks the button busy while the server action is in flight', async () => {
      let resolveAction!: (result: TSubscribeResult) => void;
      subscribeToNewsletterActionMock.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveAction = resolve;
          }),
      );
      await typeAndSubmit(user, MOCK_EMAIL);

      const button = screen.getByRole('button', {
        name: SUBSCRIBE_BUTTON_NAME,
      });
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-busy', 'true');
      });

      resolveAction({ outcome: ACTION_OUTCOME.SUCCESS });

      const successMessage = await screen.findByText(SUCCESS_MESSAGE);
      expect(successMessage).toBeVisible();
    });

    it('shows the success message once the server action resolves SUCCESS', async () => {
      subscribeToNewsletterActionMock.mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      await typeAndSubmit(user, MOCK_EMAIL);

      const status = await screen.findByRole('status');

      expect(status).toHaveTextContent(SUCCESS_MESSAGE);
      expect(subscribeToNewsletterActionMock).toHaveBeenCalledWith(MOCK_EMAIL);
    });

    it.each([
      [
        NEWSLETTER_OUTCOME.ALREADY_SUBSCRIBED,
        'That email is already subscribed.',
      ],
      [
        ACTION_OUTCOME.RATE_LIMITED,
        'Too many attempts. Wait a few minutes and try again.',
      ],
      [ACTION_OUTCOME.SERVER_ERROR, 'Something went wrong. Please try again.'],
      [
        ACTION_OUTCOME.UNAVAILABLE,
        "This site isn't taking new subscriptions right now.",
      ],
    ])(
      'shows its message when the server action resolves %s',
      async (outcome, message) => {
        subscribeToNewsletterActionMock.mockResolvedValueOnce({ outcome });
        await typeAndSubmit(user, MOCK_EMAIL);

        const alert = await screen.findByRole('alert');

        expect(alert).toHaveTextContent(message);
      },
    );

    it('clears the error once the reader edits the email', async () => {
      await typeAndSubmit(user, MOCK_MALFORMED_EMAIL);
      await screen.findByRole('alert');
      const emailField = screen.getByRole('textbox', {
        name: EMAIL_FIELD_NAME,
      });

      await user.type(emailField, MOCK_EXTRA_CHARACTER);

      const alert = screen.queryByRole('alert');
      expect(alert).not.toBeInTheDocument();
    });

    it('shows the error again when an invalid email is submitted twice', async () => {
      await typeAndSubmit(user, MOCK_MALFORMED_EMAIL);
      await screen.findByRole('alert');
      const emailField = screen.getByRole('textbox', {
        name: EMAIL_FIELD_NAME,
      });
      const subscribeButton = screen.getByRole('button', {
        name: SUBSCRIBE_BUTTON_NAME,
      });

      await user.clear(emailField);
      await user.type(emailField, MOCK_MALFORMED_EMAIL);
      await user.click(subscribeButton);

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(INVALID_EMAIL_MESSAGE);
    });
  });

  it('describes each form field by its own error when two forms share a page', async () => {
    renderElement(
      <>
        <NewsletterForm variant="full" />
        <NewsletterForm variant="full" />
      </>,
    );

    const [firstInput, secondInput] = screen.getAllByRole('textbox', {
      name: EMAIL_FIELD_NAME,
    });
    const [firstButton, secondButton] = screen.getAllByRole('button', {
      name: SUBSCRIBE_BUTTON_NAME,
    });
    if (!firstInput || !secondInput || !firstButton || !secondButton) {
      throw new Error('Expected two rendered email fields and buttons.');
    }

    await user.type(firstInput, MOCK_MALFORMED_EMAIL);
    await user.click(firstButton);
    await user.type(secondInput, MOCK_MALFORMED_EMAIL);
    await user.click(secondButton);

    const alerts = await screen.findAllByRole('alert');
    expect(alerts).toHaveLength(2);
    expect(firstInput).toHaveAccessibleDescription(INVALID_EMAIL_MESSAGE);
    expect(secondInput).toHaveAccessibleDescription(INVALID_EMAIL_MESSAGE);
    expect(firstInput.getAttribute(DESCRIBED_BY_ATTRIBUTE)).not.toBe(
      secondInput.getAttribute(DESCRIBED_BY_ATTRIBUTE),
    );
  });

  it('renders no heading of its own', () => {
    setup();

    const heading = screen.queryByRole('heading');

    expect(heading).not.toBeInTheDocument();
  });

  it('renders the content text in the full variant', () => {
    setup({ content: MOCK_CONTENT });

    const contentText = screen.getByText(MOCK_CONTENT);

    expect(contentText).toBeVisible();
  });

  it('does not render the content text in the compact variant', () => {
    setup({ variant: 'compact', content: MOCK_CONTENT });

    const contentText = screen.queryByText(MOCK_CONTENT);

    expect(contentText).not.toBeInTheDocument();
  });

  it('renders the CMS-authored trust cues for the full variant', () => {
    setup({ trustCues: [MOCK_FIRST_TRUST_CUE, MOCK_SECOND_TRUST_CUE] });

    const firstCueText = screen.getByText(MOCK_FIRST_TRUST_CUE);
    const secondCueText = screen.getByText(MOCK_SECOND_TRUST_CUE);

    expect(firstCueText).toBeVisible();
    expect(secondCueText).toBeVisible();
  });

  it.each([
    ['undefined (not authored)', undefined],
    ['an empty array (author cleared it)', []],
  ])('renders no trust cues when trustCues is %s', (_, trustCues) => {
    setup({ trustCues });

    const firstCueText = screen.queryByText(MOCK_FIRST_TRUST_CUE);
    const secondCueText = screen.queryByText(MOCK_SECOND_TRUST_CUE);

    expect(firstCueText).not.toBeInTheDocument();
    expect(secondCueText).not.toBeInTheDocument();
  });

  it('omits authored trust cues in the compact variant', () => {
    setup({
      variant: 'compact',
      trustCues: [MOCK_FIRST_TRUST_CUE, MOCK_SECOND_TRUST_CUE],
    });

    const firstCueText = screen.queryByText(MOCK_FIRST_TRUST_CUE);
    const secondCueText = screen.queryByText(MOCK_SECOND_TRUST_CUE);

    expect(firstCueText).not.toBeInTheDocument();
    expect(secondCueText).not.toBeInTheDocument();
  });
});
