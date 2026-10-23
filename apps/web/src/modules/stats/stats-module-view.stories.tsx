import { BRAND_VARIANT, CONTENT_ALIGNMENT } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MOCK_CTA_ACTIONS } from '@web/testing/modules/cta/fixtures';
import {
  MOCK_STAT_ITEMS,
  mockStatItem,
} from '@web/testing/modules/stats/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { StatsModuleView } from './stats-module-view';

const FIRST_STAT_DESCRIPTION = 'up 38% year over year';
const FOOTNOTE = 'Figures reflect the trailing 12 months.';
const STAT_DESCRIPTIONS = [
  FIRST_STAT_DESCRIPTION,
  'measured at the edge',
  'from 12,000 reviews',
  'across 30 regions',
];

const stats = [
  mockStatItem({ description: FIRST_STAT_DESCRIPTION }),
  ...MOCK_STAT_ITEMS.slice(1),
  mockStatItem({
    id: 'stat-3',
    value: '4.9/5',
    label: 'Average rating',
  }),
  mockStatItem({
    id: 'stat-4',
    value: '24/7',
    label: 'Global coverage',
  }),
];

const statsWithDescriptions = stats.map((stat, index) => ({
  ...stat,
  description: STAT_DESCRIPTIONS[index],
}));

const fasterIndexingStat = mockStatItem({
  id: 'stat-5',
  value: '3×',
  label: 'Faster indexing',
});

const eightCharacterStats = [
  mockStatItem({ id: 'stat-1', value: '1,234.5K', label: 'Page views' }),
  mockStatItem({ id: 'stat-2', value: '$12,500+', label: 'Raised' }),
  mockStatItem({ id: 'stat-3', value: '99.9999%', label: 'Uptime' }),
];

const meta = {
  title: 'Modules/StatsModule',
  component: StatsModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    brandVariant: {
      control: 'select',
      options: Object.values(BRAND_VARIANT),
    },
    contentAlignment: {
      control: 'select',
      options: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
    },
  },
  args: {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockHeadingBlock({ heading: 'By the numbers' }),
    stats: stats.slice(0, 2),
    footnote: undefined,
    ctaButtons: [],
    contentAlignment: undefined,
    layout: undefined,
    titleId: 'stats-title',
    dataTestId: 'stats-module-stats-1',
  },
} satisfies Meta<typeof StatsModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const TwoFigures: TStory = {};

export const FourFigures: TStory = {
  args: { stats },
};

export const FiveFigures: TStory = {
  args: {
    stats: [...stats, fasterIndexingStat],
  },
};

export const SixFigures: TStory = {
  args: {
    stats: [
      ...stats,
      fasterIndexingStat,
      mockStatItem({ id: 'stat-6', value: 'Top 10', label: 'Industry rank' }),
    ],
  },
};

export const WithFootnote: TStory = {
  args: {
    stats,
    footnote: FOOTNOTE,
  },
};

export const WithActions: TStory = {
  args: {
    stats,
    ctaButtons: MOCK_CTA_ACTIONS,
  },
};

export const CenterAligned: TStory = {
  args: {
    stats,
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
  },
};

export const LeftAlignedWithFootnote: TStory = {
  args: {
    stats,
    footnote: FOOTNOTE,
    contentAlignment: CONTENT_ALIGNMENT.LEFT,
  },
};

export const CenterAlignedWithFootnote: TStory = {
  args: {
    stats,
    footnote: FOOTNOTE,
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
  },
};

export const Secondary: TStory = {
  args: {
    stats,
    brandVariant: BRAND_VARIANT.SECONDARY,
  },
};

export const BrandPrimary: TStory = {
  args: {
    stats,
    brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
  },
};

export const EightCharacterValues: TStory = {
  args: { stats: eightCharacterStats },
};

export const SidebarColumn: TStory = {
  globals: { viewport: 'desktop' },
  args: {
    stats: statsWithDescriptions,
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
};

export const SidebarColumnBrandPrimary: TStory = {
  globals: SidebarColumn.globals,
  args: {
    stats: stats.slice(0, 3),
    brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
  },
  decorators: SidebarColumn.decorators,
};

export const Tablet: TStory = {
  globals: { viewport: 'tablet' },
  args: FiveFigures.args,
};

export const Phone: TStory = {
  globals: { viewport: 'mobile' },
  args: { stats },
};

export const PhoneEightCharacterValues: TStory = {
  globals: { viewport: 'mobile' },
  args: EightCharacterValues.args,
};
