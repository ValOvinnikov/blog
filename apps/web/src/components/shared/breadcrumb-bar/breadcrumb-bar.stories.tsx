import { Breadcrumbs } from '@shinefold/ui/components/molecules/breadcrumbs';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SmartLink } from '@web/components/shared/smart-link';

import { BreadcrumbBar } from './breadcrumb-bar';

const meta = {
  title: 'Components/BreadcrumbBar',
  component: BreadcrumbBar,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof BreadcrumbBar>;

export default meta;
type TStory = StoryObj<typeof meta>;

const HOME_ITEM = { label: 'Home', href: '/' };
const ENGINEERING_ITEM = { label: 'Engineering', href: '/topics/engineering' };

export const Default: TStory = {
  args: {
    children: (
      <Breadcrumbs
        items={[
          HOME_ITEM,
          ENGINEERING_ITEM,
          {
            label: 'How we ship reviews faster',
            href: '/blog/how-we-ship-reviews-faster',
          },
        ]}
        ariaLabel="Breadcrumb"
        linkAs={SmartLink}
      />
    ),
  },
};

export const SingleItem: TStory = {
  args: {
    children: (
      <Breadcrumbs
        items={[HOME_ITEM]}
        ariaLabel="Breadcrumb"
        linkAs={SmartLink}
      />
    ),
  },
};

export const LongCurrentPage: TStory = {
  args: {
    children: (
      <Breadcrumbs
        items={[
          HOME_ITEM,
          ENGINEERING_ITEM,
          {
            label:
              'A very long post title that keeps going well past a comfortable line length for the current breadcrumb segment',
            href: '/blog/a-very-long-post-title',
          },
        ]}
        ariaLabel="Breadcrumb"
        linkAs={SmartLink}
      />
    ),
  },
};

export const AbovePageHeading: TStory = {
  args: {
    isAbovePageHeading: true,
    children: (
      <Breadcrumbs
        items={[HOME_ITEM, { label: 'Modules', href: '/modules' }]}
        ariaLabel="Breadcrumb"
        linkAs={SmartLink}
      />
    ),
  },
};
