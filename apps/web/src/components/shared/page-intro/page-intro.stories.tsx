import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PageHeading } from '@web/components/shared/page-heading';

import { PageIntro } from './page-intro';

const meta = {
  title: 'Components/PageIntro',
  component: PageIntro,
  tags: ['autodocs'],
  args: {
    hero: undefined,
    locale: 'en',
    tenant: 'tenant-1',
    children: (
      <PageHeading
        heading="Notes on building things"
        supportingText="Essays and notes from the team, published as we ship."
      />
    ),
  },
} satisfies Meta<typeof PageIntro>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const FallbackHeading: TStory = {};
