import type { Meta, StoryObj } from '@storybook/react-vite';
import type { AnchorHTMLAttributes } from 'react';

import { CommandLink } from './command-link';

const MockLink = ({
  href,
  children,
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a href={href} data-mock-router-link="true" {...rest}>
    {children}
  </a>
);

const meta = {
  title: 'Molecules/CommandLink',
  component: CommandLink,
  tags: ['autodocs'],
  args: {
    href: '/',
    command: 'cd ~',
    ariaLabel: 'Return home',
  },
} satisfies Meta<typeof CommandLink>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const NoArrow: TStory = {
  args: {
    href: '/archive',
    command: 'ls ~/posts',
    ariaLabel: 'Browse the archive',
    prompt: '›',
    showArrow: false,
  },
};

export const WithCursor: TStory = {
  args: { showCursor: true },
};

export const CustomPrompt: TStory = {
  args: {
    command: 'whoami',
    ariaLabel: 'View author profile',
    prompt: '>',
  },
};

export const AsRouterLink: TStory = {
  args: { as: MockLink },
};
