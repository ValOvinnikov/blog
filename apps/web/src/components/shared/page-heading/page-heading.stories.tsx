import { CONTENT_ALIGNMENT } from '@shinefold/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { PageHeading } from './page-heading';

const HEADING = 'Notes on building things';
const SUPPORTING_TEXT = 'Essays and notes from the team, published as we ship.';

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
      heading: HEADING,
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
      heading: HEADING,
      supportingText: SUPPORTING_TEXT,
    },
  },
};

const LONG_SUPPORTING_TEXT =
  'Essays and notes from the team on design systems, content modelling and the small decisions that shape a product, published as we ship and revisited when we learn something new.';

export const WithLongSupportingText: TStory = {
  args: {
    headingBlock: {
      heading: HEADING,
      supportingText: LONG_SUPPORTING_TEXT,
    },
  },
};

export const CenterAlignedWithLongSupportingText: TStory = {
  args: {
    align: CONTENT_ALIGNMENT.CENTER,
    headingBlock: {
      heading: HEADING,
      supportingText: LONG_SUPPORTING_TEXT,
    },
  },
};

export const CenterAligned: TStory = {
  args: {
    align: CONTENT_ALIGNMENT.CENTER,
    headingBlock: {
      heading: HEADING,
      supportingText: SUPPORTING_TEXT,
    },
  },
};

export const RightAligned: TStory = {
  args: {
    align: CONTENT_ALIGNMENT.RIGHT,
    headingBlock: {
      heading: HEADING,
      supportingText: SUPPORTING_TEXT,
    },
  },
};
