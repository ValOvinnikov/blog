import { WindowChrome } from '@blog/ui/molecules/window-chrome';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { NewsletterPreferencesSection } from './newsletter-preferences-section';

const meta = {
  title: 'Organisms/NewsletterPreferencesSection',
  component: NewsletterPreferencesSection,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    title: 'Newsletter',
  },
  render: (args) => (
    <WindowChrome>
      <WindowChrome.Bar>
        <WindowChrome.User>val</WindowChrome.User>
        <WindowChrome.Prompt>@ovinnikov:~$</WindowChrome.Prompt> account --email
      </WindowChrome.Bar>
      <WindowChrome.Body>
        <NewsletterPreferencesSection {...args} />
      </WindowChrome.Body>
    </WindowChrome>
  ),
} satisfies Meta<typeof NewsletterPreferencesSection>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Active: TStory = {
  args: {
    status: 'active',
    badgeLabel: 'subscribed',
    description: (
      <>
        Weekly posts delivered to{' '}
        <span className="font-mono text-text">val@icloud.com</span> (your
        account email — read-only in v1).
      </>
    ),
    actionLabel: 'unsubscribe',
    onUnsubscribe: () => {},
  },
};

export const Pending: TStory = {
  args: {
    status: 'pending',
    badgeLabel: 'pending confirmation',
    description:
      "The double-opt-in link hasn't been clicked yet. Resend it if it never arrived.",
    actionLabel: '↻ resend confirmation',
    onResendConfirmation: () => {},
  },
};
