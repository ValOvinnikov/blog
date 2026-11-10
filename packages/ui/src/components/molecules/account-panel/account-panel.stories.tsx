import { ACCOUNT_BUTTON_STYLE, ACCOUNT_PANEL_STYLE } from '@blog/config';
import { AccountTrigger } from '@blog/ui/components/molecules/account-trigger';
import { PopoverMenu } from '@blog/ui/components/molecules/popover-menu';
import { CardStyles } from '@blog/ui/testing/card-styles';
import { objectKeys } from '@blog/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { fn, within } from 'storybook/test';

import { AccountPanel, type TAccountPanelProps } from './account-panel';
import { accountPanelVariants } from './account-panel-variants';

const PANEL_ID = 'account-panel';
const PANEL_LABEL = 'Account menu';
const READER = { name: 'Sam Reader', email: 'sam@example.com' };
const BOOKMARKS_HREF = '#bookmarks';
const SETTINGS_HREF = '#settings';
const BOOKMARKS_DESCRIPTION = 'Posts you saved to read later';
const BOOKMARKS_LABEL = 'My bookmarks';
const HUB_BOOKMARKS_LABEL = 'Bookmarks';
const SETTINGS_DESCRIPTION = 'Name, sign-in methods, your data';

const HUB_LINKS = {
  bookmarks: {
    href: BOOKMARKS_HREF,
    label: HUB_BOOKMARKS_LABEL,
    description: BOOKMARKS_DESCRIPTION,
  },
  settings: {
    href: SETTINGS_HREF,
    label: 'Settings',
    description: SETTINGS_DESCRIPTION,
  },
};

const InteractiveAccountPanel = (args: TAccountPanelProps) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <PopoverMenu>
      <AccountTrigger
        appearance={ACCOUNT_BUTTON_STYLE.CIRCLE}
        labels={{ signIn: 'Sign in', account: PANEL_LABEL }}
        user={args.user}
        isOpen={isOpen}
        panelId={args.panel.id}
        onClick={() => setIsOpen((current) => !current)}
      />
      <AccountPanel {...args} panel={{ ...args.panel, isOpen }} />
    </PopoverMenu>
  );
};

const meta = {
  title: 'Molecules/AccountPanel',
  component: AccountPanel,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="flex min-h-[360px] items-start justify-end p-8">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    appearance: {
      control: 'select',
      options: objectKeys(accountPanelVariants.variants.appearance),
    },
  },
  args: {
    appearance: ACCOUNT_PANEL_STYLE.CARD,
    user: READER,
    links: {
      bookmarks: {
        href: BOOKMARKS_HREF,
        label: BOOKMARKS_LABEL,
        description: BOOKMARKS_DESCRIPTION,
      },
      settings: {
        href: SETTINGS_HREF,
        label: 'Account settings',
        description: SETTINGS_DESCRIPTION,
      },
    },
    signOut: { label: 'Sign out', onClick: fn() },
    panel: { id: PANEL_ID, isOpen: true, ariaLabel: PANEL_LABEL },
    className: 'w-80',
  },
  render: (args) => <InteractiveAccountPanel {...args} />,
} satisfies Meta<typeof AccountPanel>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Card: TStory = {};

export const CurrentAndFocusedRows: TStory = {
  name: 'Current row, with another row focused',
  args: {
    links: {
      ...meta.args.links,
      settings: { ...meta.args.links.settings, isCurrent: true },
    },
  },
  play: ({ canvasElement }) => {
    within(canvasElement)
      .getByRole('menuitem', { name: BOOKMARKS_LABEL })
      .focus();
  },
};

export const Profile: TStory = {
  args: { appearance: ACCOUNT_PANEL_STYLE.PROFILE },
};

export const Hub: TStory = {
  render: (args) => (
    <CardStyles className="relative min-h-[360px]">
      {(cardStyle) => (
        <InteractiveAccountPanel
          {...args}
          panel={{ ...args.panel, id: `${PANEL_ID}-${cardStyle}` }}
        />
      )}
    </CardStyles>
  ),
  args: {
    appearance: ACCOUNT_PANEL_STYLE.HUB,
    links: HUB_LINKS,
  },
};

export const HubCurrentAndFocusedTiles: TStory = {
  ...Hub,
  name: 'Hub, current tile with another tile focused',
  args: {
    appearance: ACCOUNT_PANEL_STYLE.HUB,
    links: {
      ...HUB_LINKS,
      settings: { ...HUB_LINKS.settings, isCurrent: true },
    },
  },
  play: ({ canvasElement }) => {
    within(canvasElement)
      .getAllByRole('menuitem', { name: HUB_BOOKMARKS_LABEL })[0]
      ?.focus();
  },
};

export const WithoutBookmarks: TStory = {
  render: (args) => (
    <div className="grid gap-6">
      {Object.values(ACCOUNT_PANEL_STYLE).map((appearance) => (
        <div key={appearance} className="relative min-h-[360px]">
          <p>{appearance}</p>
          <InteractiveAccountPanel
            {...args}
            appearance={appearance}
            links={{ settings: args.links.settings }}
            panel={{ ...args.panel, id: `${PANEL_ID}-${appearance}` }}
          />
        </div>
      ))}
    </div>
  ),
};

export const WithPhoto: TStory = {
  args: {
    user: {
      ...READER,
      image: 'https://i.pravatar.cc/150?img=5',
    },
  },
};

export const LongNameAndEmail: TStory = {
  args: {
    user: {
      name: 'Samantha Alexandra Reader-Montgomery',
      email: 'samantha.alexandra.reader-montgomery@example.com',
    },
  },
};
