import type { Meta, StoryObj } from '@storybook/react';
import { Check, Link2, Share2 } from 'lucide-react';
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
  const [open, setOpen] = useState(false);

  return (
    <PopoverMenu>
      <PopoverMenu.Trigger
        ariaLabel="Open menu"
        open={open}
        panelId="popover-menu-panel"
        onClick={() => setOpen((current) => !current)}
      >
        <Share2 size={16} strokeWidth={1.6} aria-hidden="true" />
      </PopoverMenu.Trigger>
      <PopoverMenu.Panel id="popover-menu-panel" open={open} ariaLabel="Menu">
        <PopoverMenu.Item
          icon={<Link2 size={16} strokeWidth={1.6} aria-hidden="true" />}
        >
          Copy link
        </PopoverMenu.Item>
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
          open
          panelId="popover-menu-panel"
        >
          <Share2 size={16} strokeWidth={1.6} aria-hidden="true" />
        </PopoverMenu.Trigger>
        <PopoverMenu.Panel id="popover-menu-panel" open ariaLabel="Menu">
          <PopoverMenu.Item
            icon={<Check size={16} strokeWidth={1.6} aria-hidden="true" />}
          >
            Copied
          </PopoverMenu.Item>
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
          open={false}
          panelId="popover-menu-panel"
        >
          <Share2 size={16} strokeWidth={1.6} aria-hidden="true" />
        </PopoverMenu.Trigger>
        <PopoverMenu.Panel
          id="popover-menu-panel"
          open={false}
          ariaLabel="Menu"
        >
          <PopoverMenu.Item
            icon={<Link2 size={16} strokeWidth={1.6} aria-hidden="true" />}
          >
            Copy link
          </PopoverMenu.Item>
        </PopoverMenu.Panel>
      </>
    ),
  },
};
