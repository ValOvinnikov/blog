import { routes, SIZE } from '@shinefold/config';
import { Button } from '@shinefold/ui/components/atoms/button';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ConsentBanner } from './consent-banner';

const meta = {
  title: 'Molecules/ConsentBanner',
  component: ConsentBanner,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    heading: 'We use cookies',
    message:
      'We use cookies to understand how the site is used and to remember your preferences.',
    actions: (
      <>
        <Button variant="primary" size={SIZE.SM}>
          Accept all
        </Button>
        <Button variant="primary" size={SIZE.SM}>
          Reject all
        </Button>
        <Button variant="link" size={SIZE.SM} className="ml-auto">
          Settings
        </Button>
      </>
    ),
  },
} satisfies Meta<typeof ConsentBanner>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

const POLICY_LINK = { href: routes.privacy(), label: 'Privacy policy' };

export const WithPolicyLink: TStory = {
  args: { policyLink: POLICY_LINK },
};

export const WithPolicyLinkOnPhone: TStory = {
  args: { policyLink: POLICY_LINK },
  globals: { viewport: 'phone' },
};

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

export const WithPolicyLinkLightAndDark: TStory = {
  ...EqualWeightComparison,
  args: { policyLink: POLICY_LINK },
};
