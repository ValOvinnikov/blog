import type { Meta, StoryObj } from '@storybook/react-vite';

import { CtaModule } from './cta-module';

const meta = {
  title: 'Organisms/CtaModule',
  component: CtaModule,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    heading: 'Never miss a post',
    headingId: 'cta-module-heading',
    text: 'Subscribe to get new articles on design systems and engineering delivered straight to your inbox.',
    action: <a href="/subscribe">Subscribe now</a>,
  },
} satisfies Meta<typeof CtaModule>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithoutText: TStory = {
  args: {
    text: undefined,
  },
};

export const WithoutAction: TStory = {
  args: {
    action: undefined,
  },
};
