import { ICONS, SIZE } from '@shinefold/config';
import type { IWithChildren } from '@shinefold/config/react';
import { Avatar } from '@shinefold/ui/components/atoms/avatar';
import { Icon } from '@shinefold/ui/components/atoms/icon';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { PopoverMenu } from './popover-menu';

const meta = {
  title: 'Molecules/PopoverMenu',
  component: PopoverMenu,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [
    (Story) => (
      <div className="min-h-[220px] p-8">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PopoverMenu>;

export default meta;
type TStory = StoryObj<typeof meta>;

const MOCK_SHARE_URL = 'https://example.com';

type TShareMenuProps = IWithChildren & {
  isOpen: boolean;
  panelId: string;
  shouldOpenFromStartOnPhone?: boolean;
  onTriggerClick?: () => void;
};

const ShareMenu = ({
  isOpen,
  panelId,
  shouldOpenFromStartOnPhone,
  onTriggerClick,
  children,
}: TShareMenuProps) => (
  <>
    <PopoverMenu.Trigger
      ariaLabel="Open menu"
      isOpen={isOpen}
      panelId={panelId}
      onClick={onTriggerClick}
    >
      <Icon name={ICONS.SHARE} size={SIZE.SM} />
    </PopoverMenu.Trigger>
    <PopoverMenu.Panel
      id={panelId}
      isOpen={isOpen}
      ariaLabel="Menu"
      shouldOpenFromStartOnPhone={shouldOpenFromStartOnPhone}
    >
      {children}
    </PopoverMenu.Panel>
  </>
);

const InteractiveDemo = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <PopoverMenu>
      <ShareMenu
        isOpen={isOpen}
        panelId="popover-menu-panel"
        onTriggerClick={() => setIsOpen((current) => !current)}
      >
        <PopoverMenu.Item
          icon={<Icon name={ICONS.EXTERNAL_LINK} size={SIZE.SM} />}
        >
          Copy link
        </PopoverMenu.Item>
        <PopoverMenu.Separator />
        <PopoverMenu.Item as="a" href={MOCK_SHARE_URL}>
          Share on X
        </PopoverMenu.Item>
        <PopoverMenu.Item as="a" href={MOCK_SHARE_URL}>
          Share on LinkedIn
        </PopoverMenu.Item>
      </ShareMenu>
    </PopoverMenu>
  );
};

export const Interactive: TStory = {
  render: () => <InteractiveDemo />,
};

export const Copied: TStory = {
  args: {
    children: (
      <ShareMenu isOpen={true} panelId="popover-menu-panel">
        <PopoverMenu.Item icon={<Icon name={ICONS.CHECK} size={SIZE.SM} />}>
          Copied
        </PopoverMenu.Item>
        <PopoverMenu.Separator />
        <PopoverMenu.Item as="a" href={MOCK_SHARE_URL}>
          Share on X
        </PopoverMenu.Item>
        <PopoverMenu.Item as="a" href={MOCK_SHARE_URL}>
          Share on LinkedIn
        </PopoverMenu.Item>
      </ShareMenu>
    ),
  },
};

export const CurrentItem: TStory = {
  args: {
    children: (
      <>
        <PopoverMenu.Trigger
          ariaLabel="Choose language"
          isOpen={true}
          panelId="popover-menu-panel-current"
        >
          <Icon name={ICONS.GLOBE} size={SIZE.SM} />
        </PopoverMenu.Trigger>
        <PopoverMenu.Panel
          id="popover-menu-panel-current"
          isOpen={true}
          ariaLabel="Languages"
        >
          <PopoverMenu.Item
            as="a"
            href="#en"
            aria-current="page"
            icon={<Icon name={ICONS.CHECK} size={SIZE.SM} />}
          >
            English
          </PopoverMenu.Item>
          <PopoverMenu.Item as="a" href="#de">
            Deutsch
          </PopoverMenu.Item>
          <PopoverMenu.Item as="a" href="#fr">
            Français
          </PopoverMenu.Item>
        </PopoverMenu.Panel>
      </>
    ),
  },
};

export const Closed: TStory = {
  args: {
    children: (
      <ShareMenu isOpen={false} panelId="popover-menu-panel">
        <PopoverMenu.Item
          icon={<Icon name={ICONS.EXTERNAL_LINK} size={SIZE.SM} />}
        >
          Copy link
        </PopoverMenu.Item>
      </ShareMenu>
    ),
  },
};

export const BorderedItems: TStory = {
  args: {
    children: (
      <ShareMenu isOpen={true} panelId="popover-menu-panel-bordered">
        <PopoverMenu.Item
          variant="bordered"
          icon={<Icon name={ICONS.GITHUB} size={SIZE.SM} />}
        >
          Continue with GitHub
        </PopoverMenu.Item>
        <PopoverMenu.Item
          variant="bordered"
          icon={<Icon name={ICONS.GOOGLE} size={SIZE.SM} />}
        >
          Continue with Google
        </PopoverMenu.Item>
      </ShareMenu>
    ),
  },
};

export const AvatarTrigger: TStory = {
  args: {
    children: (
      <>
        <PopoverMenu.Trigger
          ariaLabel="Open account menu"
          isOpen={false}
          panelId="popover-menu-panel-avatar"
          variant="avatar"
        >
          <Avatar name="Ada Lovelace" alt="" size={SIZE.SM} />
        </PopoverMenu.Trigger>
        <PopoverMenu.Panel
          id="popover-menu-panel-avatar"
          isOpen={false}
          ariaLabel="Account menu"
        >
          <PopoverMenu.Item>Account settings</PopoverMenu.Item>
        </PopoverMenu.Panel>
      </>
    ),
  },
};

// The panel's start alignment forks on the real `sm:` breakpoint, so the
// phone state only shows with the viewport pinned.
export const OpenFromStartOnPhone: TStory = {
  globals: { viewport: 'phone' },
  args: {
    children: (
      <ShareMenu
        isOpen={true}
        panelId="popover-menu-panel-start"
        shouldOpenFromStartOnPhone={true}
      >
        <PopoverMenu.Item
          icon={<Icon name={ICONS.EXTERNAL_LINK} size={SIZE.SM} />}
        >
          Copy link
        </PopoverMenu.Item>
        <PopoverMenu.Separator />
        <PopoverMenu.Item as="a" href={MOCK_SHARE_URL}>
          Share on X
        </PopoverMenu.Item>
      </ShareMenu>
    ),
  },
};
