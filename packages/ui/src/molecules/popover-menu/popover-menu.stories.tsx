import { ICONS, SIZE } from '@blog/config';
import { Avatar } from '@blog/ui/atoms/avatar';
import { Icon } from '@blog/ui/atoms/icon';
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

const InteractiveDemo = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <PopoverMenu>
      <PopoverMenu.Trigger
        ariaLabel="Open menu"
        isOpen={isOpen}
        panelId="popover-menu-panel"
        onClick={() => setIsOpen((current) => !current)}
      >
        <Icon name={ICONS.SHARE} size={SIZE.SM} />
      </PopoverMenu.Trigger>
      <PopoverMenu.Panel
        id="popover-menu-panel"
        isOpen={isOpen}
        ariaLabel="Menu"
      >
        <PopoverMenu.Item
          icon={<Icon name={ICONS.EXTERNAL_LINK} size={SIZE.SM} />}
        >
          Copy link
        </PopoverMenu.Item>
        <PopoverMenu.Separator />
        <PopoverMenu.Item as="a" href="https://example.com">
          Share on X
        </PopoverMenu.Item>
        <PopoverMenu.Item as="a" href="https://example.com">
          Share on LinkedIn
        </PopoverMenu.Item>
      </PopoverMenu.Panel>
    </PopoverMenu>
  );
};

export const Interactive: TStory = {
  render: () => <InteractiveDemo />,
};

export const Copied: TStory = {
  args: {
    children: (
      <>
        <PopoverMenu.Trigger
          ariaLabel="Open menu"
          isOpen={true}
          panelId="popover-menu-panel"
        >
          <Icon name={ICONS.SHARE} size={SIZE.SM} />
        </PopoverMenu.Trigger>
        <PopoverMenu.Panel
          id="popover-menu-panel"
          isOpen={true}
          ariaLabel="Menu"
        >
          <PopoverMenu.Item icon={<Icon name={ICONS.CHECK} size={SIZE.SM} />}>
            Copied
          </PopoverMenu.Item>
          <PopoverMenu.Separator />
          <PopoverMenu.Item as="a" href="https://example.com">
            Share on X
          </PopoverMenu.Item>
          <PopoverMenu.Item as="a" href="https://example.com">
            Share on LinkedIn
          </PopoverMenu.Item>
        </PopoverMenu.Panel>
      </>
    ),
  },
};

export const Closed: TStory = {
  args: {
    children: (
      <>
        <PopoverMenu.Trigger
          ariaLabel="Open menu"
          isOpen={false}
          panelId="popover-menu-panel"
        >
          <Icon name={ICONS.SHARE} size={SIZE.SM} />
        </PopoverMenu.Trigger>
        <PopoverMenu.Panel
          id="popover-menu-panel"
          isOpen={false}
          ariaLabel="Menu"
        >
          <PopoverMenu.Item
            icon={<Icon name={ICONS.EXTERNAL_LINK} size={SIZE.SM} />}
          >
            Copy link
          </PopoverMenu.Item>
        </PopoverMenu.Panel>
      </>
    ),
  },
};

export const BorderedItems: TStory = {
  args: {
    children: (
      <>
        <PopoverMenu.Trigger
          ariaLabel="Open menu"
          isOpen={true}
          panelId="popover-menu-panel-bordered"
        >
          <Icon name={ICONS.SHARE} size={SIZE.SM} />
        </PopoverMenu.Trigger>
        <PopoverMenu.Panel
          id="popover-menu-panel-bordered"
          isOpen={true}
          ariaLabel="Menu"
        >
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
        </PopoverMenu.Panel>
      </>
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
