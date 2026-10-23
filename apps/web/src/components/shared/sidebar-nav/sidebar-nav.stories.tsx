import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  MOCK_SIDEBAR_NAV_BACK_LINK,
  MOCK_SIDEBAR_NAV_CONTENTS_ITEMS,
  MOCK_SIDEBAR_NAV_ITEMS,
  MOCK_SIDEBAR_NAV_LABEL,
  MOCK_SIDEBAR_NAV_TRIGGER_NAME,
  MOCK_SIDEBAR_NAV_NESTED_ITEMS,
  MOCK_SIDEBAR_NAV_PRICING_ITEM,
} from '@web/testing/shared/sidebar-nav/fixtures';
import { userEvent, within } from 'storybook/test';

import { SidebarNav } from './sidebar-nav';

const meta = {
  title: 'Components/SidebarNav',
  component: SidebarNav,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    items: MOCK_SIDEBAR_NAV_ITEMS,
    activeKey: MOCK_SIDEBAR_NAV_PRICING_ITEM.href,
    label: MOCK_SIDEBAR_NAV_LABEL,
    ariaCurrent: 'page',
    hasRootItem: true,
  },
} satisfies Meta<typeof SidebarNav>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Desktop: TStory = {};

export const DesktopRootActive: TStory = {
  args: { activeKey: '/modules' },
};

export const DesktopNestedSection: TStory = {
  args: {
    items: MOCK_SIDEBAR_NAV_NESTED_ITEMS,
    activeKey: '/modules/blog-hero/split-left',
    label: 'Blog hero layouts',
    backLink: MOCK_SIDEBAR_NAV_BACK_LINK,
  },
};

export const DesktopPostContents: TStory = {
  args: {
    items: MOCK_SIDEBAR_NAV_CONTENTS_ITEMS,
    activeKey: '#configuration',
    label: 'Contents',
    ariaCurrent: 'location',
    hasRootItem: false,
  },
};

export const DesktopPostContentsNestedActive: TStory = {
  args: { ...DesktopPostContents.args, activeKey: '#prerequisites' },
};

export const DesktopItemHover: TStory = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const links = canvas.getAllByRole('link', {
      name: MOCK_SIDEBAR_NAV_ITEMS.at(0)?.label,
    });
    await userEvent.hover(links.at(0)!);
  },
};

export const DesktopCurrentItemHover: TStory = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const links = canvas.getAllByRole('link', {
      name: MOCK_SIDEBAR_NAV_PRICING_ITEM.label,
    });
    await userEvent.hover(links.at(0)!);
  },
};

export const MobileClosed: TStory = {
  globals: { viewport: 'mobile' },
};

export const MobileOpen: TStory = {
  globals: { viewport: 'mobile' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: MOCK_SIDEBAR_NAV_TRIGGER_NAME }),
    );
  },
};

export const MobileOpenNestedSection: TStory = {
  globals: { viewport: 'mobile' },
  args: DesktopNestedSection.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: /Blog hero layouts/ }),
    );
  },
};

export const MobileOpenPostContents: TStory = {
  globals: { viewport: 'mobile' },
  args: DesktopPostContents.args,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /Contents/ }));
  },
};

export const MobileOpenItemHover: TStory = {
  globals: { viewport: 'mobile' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: MOCK_SIDEBAR_NAV_TRIGGER_NAME }),
    );
    const links = canvas.getAllByRole('link', {
      name: MOCK_SIDEBAR_NAV_ITEMS.at(0)?.label,
    });
    await userEvent.hover(links.at(-1)!);
  },
};

export const MobileOpenItemFocus: TStory = {
  globals: { viewport: 'mobile' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(
      canvas.getByRole('button', { name: MOCK_SIDEBAR_NAV_TRIGGER_NAME }),
    );
    const links = canvas.getAllByRole('link', {
      name: MOCK_SIDEBAR_NAV_ITEMS.at(0)?.label,
    });
    links.at(-1)!.focus();
  },
};
