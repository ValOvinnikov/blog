import { TextLink } from '@blog/ui/components/atoms/text-link';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Footer } from './footer';

const meta = {
  title: 'Organisms/Footer',
  component: Footer,
  tags: ['autodocs'],
  args: {
    children: (
      <>
        <Footer.Nav>
          <TextLink appearance="nav" href="/">
            Home
          </TextLink>
          <TextLink appearance="nav" href="/about">
            About
          </TextLink>
          <TextLink appearance="nav" href="/contact">
            Contact
          </TextLink>
        </Footer.Nav>
        <Footer.Copyright title="My Blog" year={2027} />
      </>
    ),
  },
} satisfies Meta<typeof Footer>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const Minimal: TStory = {
  args: {
    children: <Footer.Copyright title="My Blog" year={2027} />,
  },
};
