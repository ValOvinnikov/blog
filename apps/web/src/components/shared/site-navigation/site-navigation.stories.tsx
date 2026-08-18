import type { ILink } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ThemeToggleButton } from '@web/components/shared/theme-toggle-button';
import { userEvent, within } from 'storybook/test';

import { SiteNavigation } from './site-navigation';

const links: ILink[] = [
  {
    label: 'Home',
    href: '/',
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
  {
    label: 'Blog',
    href: '/blog',
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
  {
    label: 'Topics',
    href: '/topics',
    target: undefined,
    platform: undefined,
    ariaLabel: undefined,
  },
];

const meta = {
  title: 'Components/SiteNavigation',
  component: SiteNavigation,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: { links, actions: <ThemeToggleButton /> },
} satisfies Meta<typeof SiteNavigation>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Desktop: TStory = {
  globals: { viewport: 'desktop' },
};

/** The active-route highlighting `SiteNavigation` derives from the URL, not passed as a prop. */
export const ActiveBlogRoute: TStory = {
  globals: { viewport: 'desktop' },
  parameters: {
    nextjs: {
      navigation: { pathname: '/blog' },
    },
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
      canvas.getByRole('button', { name: /Toggle navigation menu/ }),
    );
  },
};
