import { CONTENT_ALIGNMENT } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { PageHeading } from './page-heading';

const meta = {
  title: 'Components/PageHeading',
  component: PageHeading,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    align: {
      control: 'select',
      options: Object.values(CONTENT_ALIGNMENT),
    },
  },
  args: {
    headingBlock: {
      heading: 'Notes on building things',
      supportingText: undefined,
    },
    align: undefined,
  },
} satisfies Meta<typeof PageHeading>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithSupportingText: TStory = {
  args: {
    headingBlock: {
      heading: 'Notes on building things',
      supportingText: 'Essays and notes from the team, published as we ship.',
    },
  },
};

const LONG_SUPPORTING_TEXT =
  'Essays and notes from the team on design systems, content modelling and the small decisions that shape a product, published as we ship and revisited when we learn something new.';

export const WithLongSupportingText: TStory = {
  args: {
    headingBlock: {
      heading: 'Notes on building things',
      supportingText: LONG_SUPPORTING_TEXT,
    },
  },
};

export const CenterAlignedWithLongSupportingText: TStory = {
  args: {
    align: CONTENT_ALIGNMENT.CENTER,
    headingBlock: {
      heading: 'Notes on building things',
      supportingText: LONG_SUPPORTING_TEXT,
    },
  },
};

export const CenterAligned: TStory = {
  args: {
    align: CONTENT_ALIGNMENT.CENTER,
    headingBlock: {
      heading: 'Notes on building things',
      supportingText: 'Essays and notes from the team, published as we ship.',
    },
  },
};

export const RightAligned: TStory = {
  args: {
    align: CONTENT_ALIGNMENT.RIGHT,
    headingBlock: {
      heading: 'Notes on building things',
      supportingText: 'Essays and notes from the team, published as we ship.',
    },
  },
};
