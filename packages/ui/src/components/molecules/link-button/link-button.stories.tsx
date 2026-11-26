import { buttonVariants } from '@shinefold/ui/components/atoms/button/button-variants';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { keys } from 'remeda';

import { LinkButton } from './link-button';

const meta: Meta<typeof LinkButton> = {
  title: 'Molecules/LinkButton',
  component: LinkButton,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: keys(buttonVariants.variants.size),
    },
  },
  args: {
    href: '/blog',
    children: 'Read more',
  },
};
export default meta;

type TStory = StoryObj<typeof LinkButton>;

export const Primary: TStory = {};

export const TextLink: TStory = {
  args: {
    variant: 'link',
    children: 'Browse all posts',
  },
};
