import type { Meta, StoryObj } from '@storybook/react';
import type { AnchorHTMLAttributes } from 'react';

import { ProseLink } from './prose-link';

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
  title: 'Atoms/ProseLink',
  component: ProseLink,
  tags: ['autodocs'],
  args: {
    href: '/about',
    children: 'a link inside a paragraph',
  },
} satisfies Meta<typeof ProseLink>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const InSentence: TStory = {
  render: (args) => (
    <p className="max-w-prose text-copy">
      This is a sentence with <ProseLink {...args} /> right in the middle of it,
      inheriting the surrounding font size.
    </p>
  ),
};

export const AsRouterLink: TStory = {
  args: { as: MockLink },
};
