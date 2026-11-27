import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  GRID_COLUMNS,
} from '@shinefold/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import {
  mockSectionPageCard,
  mockSectionPagesContent,
} from '@web/testing/modules/section-pages/fixtures';
import {
  MOCK_OUTLINED_BRAND_TINT_SECTION,
  MOCK_PRIMARY_SECTION,
} from '@web/testing/shared/section-appearance/fixtures';

import { SectionPagesModuleView } from './section-pages-module-view';

const pages = [
  mockSectionPageCard(),
  mockSectionPageCard({
    id: 'pricing',
    title: 'Pricing',
    summary: 'Plans for every size of team.',
    path: 'modules/pricing',
  }),
  mockSectionPageCard({
    id: 'testimonials',
    title: 'Testimonials',
    summary: undefined,
    path: 'modules/testimonials',
  }),
];

const meta = {
  title: 'Modules/SectionPagesModule',
  component: SectionPagesModuleView,
  tags: ['autodocs'],
  argTypes: {
    contentAlignment: {
      control: 'select',
      options: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
    },
    columns: {
      control: 'select',
      options: [undefined, ...Object.values(GRID_COLUMNS)],
    },
  },
  args: {
    ...mockSectionPagesContent({ pages }),
    section: MOCK_PRIMARY_SECTION,
    titleId: 'section-pages-title',
    dataTestId: 'section-pages-module-section-pages-1',
  },
} satisfies Meta<typeof SectionPagesModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithImages: TStory = {
  args: {
    pages: pages.map((page) => ({ ...page, image: mockSanityImage() })),
  },
};

export const WithoutHeading: TStory = {
  args: { headingBlock: undefined },
};

export const Secondary: TStory = {
  args: { section: { brandVariant: BRAND_VARIANT.SECONDARY } },
};

export const OutlinedOnBrandTint: TStory = {
  args: { section: MOCK_OUTLINED_BRAND_TINT_SECTION },
};

export const ThreeColumnsOneChild: TStory = {
  args: { columns: GRID_COLUMNS.THREE, pages: pages.slice(0, 1) },
};

export const ThreeColumnsTwoChildren: TStory = {
  args: { columns: GRID_COLUMNS.THREE, pages: pages.slice(0, 2) },
};

export const ThreeColumnsThreeChildren: TStory = {
  args: { columns: GRID_COLUMNS.THREE },
};

export const SiteDefaultColumnsOneChild: TStory = {
  args: { pages: pages.slice(0, 1) },
};

export const SiteDefaultColumnsTwoChildren: TStory = {
  args: { pages: pages.slice(0, 2) },
};

export const TitleOnly: TStory = {
  args: {
    pages: pages.map((page) => ({ ...page, summary: undefined })),
  },
};

export const MixedTitleOnlyAndSummary: TStory = {
  args: {
    pages: [
      ...pages,
      mockSectionPageCard({
        id: 'contact',
        title: 'Contact',
        summary: undefined,
        path: 'modules/contact',
      }),
      mockSectionPageCard({
        id: 'careers',
        title: 'Careers',
        summary: undefined,
        path: 'modules/careers',
      }),
      mockSectionPageCard({
        id: 'press',
        title: 'Press',
        summary: undefined,
        path: 'modules/press',
      }),
    ],
  },
};
