import { WindowChrome } from '@blog/ui/molecules/window-chrome';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { NewsletterPreferencesSection } from './newsletter-preferences-section';

const meta = {
  title: 'Organisms/NewsletterPreferencesSection',
  component: NewsletterPreferencesSection,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
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
    email: 'val@icloud.com',
    onUnsubscribe: () => {},
  },
};

export const Pending: TStory = {
  args: {
    status: 'pending',
    onResendConfirmation: () => {},
  },
};
