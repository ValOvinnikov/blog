import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PageHeading } from '@web/components/shared/page-heading';

import { PageShell } from './page-shell';

const meta = {
  title: 'Page Templates/PageShell',
  component: PageShell,
  tags: ['autodocs'],
  args: {
    children: (
      <>
        <PageShell.Breadcrumbs>
          <nav aria-label="Breadcrumb">Home / Blog</nav>
        </PageShell.Breadcrumbs>
        <PageShell.Heading>
          <PageHeading
            heading="Notes on building things"
            supportingText="Essays and notes from the team, published as we ship."
          />
        </PageShell.Heading>
        <PageShell.Content>
          <div className="px-gutter py-section text-muted text-center">
            Page content renders here
          </div>
        </PageShell.Content>
      </>
    ),
  },
} satisfies Meta<typeof PageShell>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const NoBreadcrumbs: TStory = {
  args: {
    children: (
      <>
        <PageShell.Heading>
          <PageHeading heading="Home" />
        </PageShell.Heading>
        <PageShell.Content>
          <div className="px-gutter py-section text-muted text-center">
            Page content renders here
          </div>
        </PageShell.Content>
      </>
    ),
  },
};

export const HeadingOnly: TStory = {
  args: {
    children: (
      <PageShell.Heading>
        <PageHeading heading="Only a heading, no content region" />
      </PageShell.Heading>
    ),
  },
};
