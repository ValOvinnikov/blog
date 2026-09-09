import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { PageIntro } from './page-intro';

const meta = {
  title: 'Components/PageIntro',
  component: PageIntro,
  tags: ['autodocs'],
  args: {
    hero: undefined,
    headingBlock: {
      heading: 'Notes on building things',
      supportingText: 'Essays and notes from the team, published as we ship.',
    },
    locale: 'en',
    tenant: 'tenant-1',
  },
} satisfies Meta<typeof PageIntro>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const FallbackHeading: TStory = {};
