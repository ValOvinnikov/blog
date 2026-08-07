import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';

import { NewsletterPreferencesSection } from './newsletter-preferences-section';

faker.seed(123);

const email = faker.internet.email();

describe(`<${NewsletterPreferencesSection.name}/>`, () => {
  describe('active status', () => {
    const onUnsubscribe = vi.fn();
    const setup = customRender(NewsletterPreferencesSection, {
      status: 'active',
      email,
      onUnsubscribe,
    });

    beforeEach(() => {
      onUnsubscribe.mockClear();
      setup();
    });

    it('renders the newsletter row title', () => {
      expect(
        screen.getByRole('heading', { name: /newsletter/i }),
      ).toBeVisible();
    });

    it('renders the subscribed badge', () => {
      expect(screen.getByText('subscribed')).toBeVisible();
    });

    it('renders the account email in the description', () => {
      expect(screen.getByText(email)).toBeVisible();
    });

    it('calls onUnsubscribe when the unsubscribe button is clicked', async () => {
      await userEvent.click(
        screen.getByRole('button', { name: 'unsubscribe' }),
      );

      expect(onUnsubscribe).toHaveBeenCalledTimes(1);
    });

    it('does not render the resend confirmation action', () => {
      expect(
        screen.queryByRole('button', { name: /resend confirmation/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe('pending status', () => {
    const onResendConfirmation = vi.fn();
    const setup = customRender(NewsletterPreferencesSection, {
      status: 'pending',
      onResendConfirmation,
    });

    beforeEach(() => {
      onResendConfirmation.mockClear();
      setup();
    });

    it('renders the newsletter row title', () => {
      expect(
        screen.getByRole('heading', { name: /newsletter/i }),
      ).toBeVisible();
    });

    it('renders the pending confirmation badge', () => {
      expect(screen.getByText('pending confirmation')).toBeVisible();
    });

    it('calls onResendConfirmation when the resend button is clicked', async () => {
      await userEvent.click(
        screen.getByRole('button', { name: /resend confirmation/i }),
      );

      expect(onResendConfirmation).toHaveBeenCalledTimes(1);
    });

    it('does not render the unsubscribe action', () => {
      expect(
        screen.queryByRole('button', { name: 'unsubscribe' }),
      ).not.toBeInTheDocument();
    });
  });

  it('forwards dataTestId to the setting row', () => {
    customRender(NewsletterPreferencesSection, {
      status: 'active',
      email,
      onUnsubscribe: () => {},
    })({ dataTestId: 'newsletter-preferences-section' });

    expect(screen.getByTestId('newsletter-preferences-section')).toBeVisible();
  });
});
