import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import userEvent from '@testing-library/user-event';

import { NewsletterPreferencesSection } from './newsletter-preferences-section';

faker.seed(123);

const title = faker.lorem.words(2);
const description = faker.lorem.sentence();
const email = faker.internet.email();

describe(`<${NewsletterPreferencesSection.name}/>`, () => {
  describe('active status', () => {
    const onUnsubscribe = vi.fn();
    const setup = customRender(NewsletterPreferencesSection, {
      status: 'active',
      title,
      badgeLabel: 'subscribed',
      description: (
        <>
          Weekly posts delivered to <span>{email}</span>.
        </>
      ),
      actionLabel: 'unsubscribe',
      onUnsubscribe,
    });

    beforeEach(() => {
      onUnsubscribe.mockClear();
      setup();
    });

    it('renders the given title', () => {
      expect(
        screen.getByRole('heading', { name: new RegExp(title) }),
      ).toBeVisible();
    });

    it('renders the given badge label', () => {
      expect(screen.getByText('subscribed')).toBeVisible();
    });

    it('renders rich description content, e.g. an embedded email element', () => {
      expect(screen.getByText(email)).toBeVisible();
    });

    it('calls onUnsubscribe when the action button is clicked', async () => {
      await userEvent.click(
        screen.getByRole('button', { name: 'unsubscribe' }),
      );

      expect(onUnsubscribe).toHaveBeenCalledTimes(1);
    });
  });

  describe('pending status', () => {
    const onResendConfirmation = vi.fn();
    const setup = customRender(NewsletterPreferencesSection, {
      status: 'pending',
      title,
      badgeLabel: 'pending confirmation',
      description,
      actionLabel: '↻ resend confirmation',
      onResendConfirmation,
    });

    beforeEach(() => {
      onResendConfirmation.mockClear();
      setup();
    });

    it('renders the given title', () => {
      expect(
        screen.getByRole('heading', { name: new RegExp(title) }),
      ).toBeVisible();
    });

    it('renders the given badge label', () => {
      expect(screen.getByText('pending confirmation')).toBeVisible();
    });

    it('calls onResendConfirmation when the action button is clicked', async () => {
      await userEvent.click(
        screen.getByRole('button', { name: '↻ resend confirmation' }),
      );

      expect(onResendConfirmation).toHaveBeenCalledTimes(1);
    });
  });

  it('forwards dataTestId to the setting row', () => {
    customRender(NewsletterPreferencesSection, {
      status: 'active',
      title,
      badgeLabel: 'subscribed',
      description,
      actionLabel: 'unsubscribe',
      onUnsubscribe: () => {},
    })({ dataTestId: 'newsletter-preferences-section' });

    expect(screen.getByTestId('newsletter-preferences-section')).toBeVisible();
  });
});
