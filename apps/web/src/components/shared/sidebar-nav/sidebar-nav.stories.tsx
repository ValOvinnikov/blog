import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { mockSidebarNavItems } from '@web/testing/shared/sidebar-nav/fixtures';
import { userEvent, within } from 'storybook/test';

import { SidebarNav } from './sidebar-nav';

const meta = {
  title: 'Components/SidebarNav',
  component: SidebarNav,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    items: mockSidebarNavItems,
    activeKey: '/modules/pricing',
    label: 'In this section',
    ariaCurrent: 'page',
  },
} satisfies Meta<typeof SidebarNav>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Desktop: TStory = {};

export const DesktopRootActive: TStory = {
  args: { activeKey: '/modules' },
};

export const MobileClosed: TStory = {
  globals: { viewport: 'mobile' },
};

export const MobileOpen: TStory = {
  globals: { viewport: 'mobile' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /In this section/ }),
    );
  },
};

// The desktop and mobile copies of each item share an accessible name; `.at(-1)` is the mobile one.
export const MobileOpenItemHover: TStory = {
  globals: { viewport: 'mobile' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /In this section/ }),
    );
    const links = canvas.getAllByRole('link', {
      name: mockSidebarNavItems.at(0)?.label,
    });
    await userEvent.hover(links.at(-1)!);
  },
};

export const MobileOpenItemFocus: TStory = {
  globals: { viewport: 'mobile' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /In this section/ }),
    );
    const links = canvas.getAllByRole('link', {
      name: mockSidebarNavItems.at(0)?.label,
    });
    links.at(-1)!.focus();
  },
};
