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

const email = faker.internet.email();
const content = faker.lorem.sentences(2);
const firstCue = faker.lorem.words(2);
const secondCue = faker.lorem.words(3);

const typeAndSubmit = async (user: UserEvent, typedEmail: string) => {
  const emailField = screen.getByRole('textbox', { name: 'Email address' });
  const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });

  await user.type(emailField, typedEmail);
  await user.click(subscribeButton);
};

describe(`<${NewsletterForm.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    subscribeToNewsletterActionMock.mockReset();
    user = userEvent.setup();
  });

  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders idle with a labeled field and submit button', () => {
      const emailField = screen.getByRole('textbox', { name: 'Email address' });
      const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });

      expect(emailField).toBeVisible();
      expect(subscribeButton).toBeVisible();
    });

    it('shows an inline error without calling the server action for a malformed email', async () => {
      await typeAndSubmit(user, faker.lorem.word());

      const alert = await screen.findByRole('alert');

      expect(alert).toHaveTextContent('Enter a valid email address.');
      expect(subscribeToNewsletterActionMock).not.toHaveBeenCalled();
    });

    it('associates the rendered error with the email field via its accessible description', async () => {
      await typeAndSubmit(user, faker.lorem.word());
      await screen.findByRole('alert');

      const emailField = screen.getByRole('textbox');

      expect(emailField).toHaveAccessibleDescription(
        'Enter a valid email address.',
      );
    });

    it('marks the button busy while the server action is in flight', async () => {
      let resolveAction!: (result: TSubscribeResult) => void;
      subscribeToNewsletterActionMock.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveAction = resolve;
          }),
      );
      await typeAndSubmit(user, email);

      const button = screen.getByRole('button', { name: 'Subscribe' });
      await waitFor(() => {
        expect(button).toHaveAttribute('aria-busy', 'true');
      });

      resolveAction({ outcome: ACTION_OUTCOME.SUCCESS });

      await waitFor(() => {
        const status = screen.getByRole('status');
        expect(status).toBeVisible();
      });
    });

    it('shows the success message once the server action resolves SUCCESS', async () => {
      subscribeToNewsletterActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
      await typeAndSubmit(user, email);

      const status = await screen.findByRole('status');

      expect(status).toHaveTextContent(
        'Almost there — check your inbox to confirm.',
      );
      expect(subscribeToNewsletterActionMock).toHaveBeenCalledWith(email);
    });

    describe('when the email is already subscribed', () => {
      beforeEach(() => {
        subscribeToNewsletterActionMock.mockResolvedValue({
          outcome: NEWSLETTER_OUTCOME.ALREADY_SUBSCRIBED,
        });
      });

      it('shows the "already subscribed" error for ALREADY_SUBSCRIBED', async () => {
        await typeAndSubmit(user, email);

        const alert = await screen.findByRole('alert');

        expect(alert).toHaveTextContent('That email is already subscribed.');
      });

      it('clears a server-returned error once the reader edits the email', async () => {
        await typeAndSubmit(user, email);
        await screen.findByRole('alert');
        const emailField = screen.getByRole('textbox', {
          name: 'Email address',
        });

        await user.type(emailField, faker.string.alpha(1));

        const alert = screen.queryByRole('alert');
        expect(alert).not.toBeInTheDocument();
      });
    });

    it.each([
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
        subscribeToNewsletterActionMock.mockResolvedValue({ outcome });
        await typeAndSubmit(user, email);

        const alert = await screen.findByRole('alert');

        expect(alert).toHaveTextContent(message);
      },
    );

    it('clears the inline validation error once the reader edits the email', async () => {
      await typeAndSubmit(user, faker.lorem.word());
      await screen.findByRole('alert');
      const emailField = screen.getByRole('textbox', { name: 'Email address' });

      await user.type(emailField, faker.string.alpha(1));

      const alert = screen.queryByRole('alert');
      expect(alert).not.toBeInTheDocument();
    });

    it('shows the error again when an invalid email is submitted a second time', async () => {
      await typeAndSubmit(user, faker.lorem.word());
      await screen.findByRole('alert');
      const emailField = screen.getByRole('textbox', { name: 'Email address' });
      const subscribeButton = screen.getByRole('button', { name: 'Subscribe' });

      await user.clear(emailField);
      await user.type(emailField, faker.lorem.word());
      await user.click(subscribeButton);

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent('Enter a valid email address.');
    });
  });

  it('gives each rendered instance its own errorMessageId, so two forms on one page never collide', async () => {
    renderElement(
      <>
        <NewsletterForm variant="full" />
        <NewsletterForm variant="full" />
      </>,
    );

    const [firstInput, secondInput] = screen.getAllByRole('textbox', {
      name: 'Email address',
    });
    const [firstButton, secondButton] = screen.getAllByRole('button', {
      name: 'Subscribe',
    });
    if (!firstInput || !secondInput || !firstButton || !secondButton) {
      throw new Error('Expected two rendered email fields and buttons.');
    }

    await user.type(firstInput, faker.lorem.word());
    await user.click(firstButton);
    await user.type(secondInput, faker.lorem.word());
    await user.click(secondButton);

    const alerts = await screen.findAllByRole('alert');
    expect(alerts).toHaveLength(2);
    expect(firstInput).toHaveAccessibleDescription(
      'Enter a valid email address.',
    );
    expect(secondInput).toHaveAccessibleDescription(
      'Enter a valid email address.',
    );
    expect(firstInput.getAttribute('aria-describedby')).not.toBe(
      secondInput.getAttribute('aria-describedby'),
    );
  });

  it('renders no heading of its own', () => {
    setup();

    const heading = screen.queryByRole('heading');

    expect(heading).not.toBeInTheDocument();
  });

  it('renders the content text in the full variant', () => {
    setup({ content });

    const contentText = screen.getByText(content);

    expect(contentText).toBeVisible();
  });

  it('does not render the content text in the compact variant', () => {
    setup({ variant: 'compact', content });

    const contentText = screen.queryByText(content);

    expect(contentText).not.toBeInTheDocument();
  });

  it('renders the CMS-authored trust cues for the full variant', () => {
    setup({ trustCues: [firstCue, secondCue] });

    const firstCueText = screen.getByText(firstCue);
    const secondCueText = screen.getByText(secondCue);

    expect(firstCueText).toBeVisible();
    expect(secondCueText).toBeVisible();
  });

  it.each([
    ['undefined (not authored)', undefined],
    ['an empty array (author cleared it)', []],
  ])('renders no trust cues when trustCues is %s', (_, trustCues) => {
    setup({ trustCues });

    const firstCueText = screen.queryByText(firstCue);
    const secondCueText = screen.queryByText(secondCue);

    expect(firstCueText).not.toBeInTheDocument();
    expect(secondCueText).not.toBeInTheDocument();
  });

  it('does not render trust cues for the compact variant even when authored', () => {
    setup({
      variant: 'compact',
      trustCues: [firstCue, secondCue],
    });

    const firstCueText = screen.queryByText(firstCue);
    const secondCueText = screen.queryByText(secondCue);

    expect(firstCueText).not.toBeInTheDocument();
    expect(secondCueText).not.toBeInTheDocument();
  });
});
