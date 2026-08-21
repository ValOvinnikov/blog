import { Breadcrumbs } from '@blog/ui/molecules/breadcrumbs';
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

export const Default: TStory = {
  args: {
    children: (
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Engineering', href: '/topics/engineering' },
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

/**
 * A single-item trail — the "current page" formatting still applies even
 * when it's also the first (Home) item.
 */
export const SingleItem: TStory = {
  args: {
    children: (
      <Breadcrumbs
        items={[{ label: 'Home', href: '/' }]}
        ariaLabel="Breadcrumb"
        linkAs={SmartLink}
      />
    ),
  },
};

/**
 * A long final segment demonstrates the trail's own truncation — earlier
 * items never shrink, only the current (last) item's text clips with an
 * ellipsis when the full trail doesn't fit on one line.
 */
export const LongCurrentPage: TStory = {
  args: {
    children: (
      <Breadcrumbs
        items={[
          { label: 'Home', href: '/' },
          { label: 'Engineering', href: '/topics/engineering' },
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
