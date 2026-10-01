import type { Meta, StoryObj } from '@storybook/react-vite';

import { ConsentBanner } from './consent-banner';

const meta = {
  title: 'Molecules/ConsentBanner',
  component: ConsentBanner,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    headingLevel: 2,
    heading: 'We use cookies',
    message:
      'We use cookies to understand how the site is used and to remember your preferences.',
    acceptLabel: 'Accept all',
    rejectLabel: 'Reject all',
    settingsLabel: 'Settings',
    onAccept: () => {},
    onReject: () => {},
    onOpenSettings: () => {},
  },
} satisfies Meta<typeof ConsentBanner>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const EqualWeightComparison: TStory = {
  render: (args) => (
    <div className="flex gap-8 p-8">
      <div className="bg-primary p-4">
        <ConsentBanner {...args} className="static inset-auto w-[22rem]" />
      </div>
      <div className="dark bg-primary p-4">
        <ConsentBanner {...args} className="static inset-auto w-[22rem]" />
      </div>
    </div>
  ),
};
