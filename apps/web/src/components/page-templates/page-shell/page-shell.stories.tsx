import { Breadcrumbs } from '@blog/ui/components/molecules/breadcrumbs';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { PageHeading } from '@web/components/shared/page-heading';
import { SmartLink } from '@web/components/shared/smart-link';

import { PageShell } from './page-shell';

const meta = {
  title: 'Page Templates/PageShell',
  component: PageShell,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    children: (
      <>
        <PageShell.Breadcrumbs>
          <nav aria-label="Breadcrumb">Home / Blog</nav>
        </PageShell.Breadcrumbs>
        <PageShell.Heading>
          <PageHeading
            headingBlock={{
              heading: 'Notes on building things',
              supportingText:
                'Essays and notes from the team, published as we ship.',
            }}
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
          <PageHeading
            headingBlock={{ heading: 'Home', supportingText: undefined }}
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
};

export const HeadingOnly: TStory = {
  args: {
    children: (
      <PageShell.Heading>
        <PageHeading
          headingBlock={{
            heading: 'Only a heading, no content region',
            supportingText: undefined,
          }}
        />
      </PageShell.Heading>
    ),
  },
};

export const BreadcrumbsInHeadingBand: TStory = {
  args: {
    children: (
      <>
        <PageShell.Breadcrumbs>
          <BreadcrumbBar isAbovePageHeading={true}>
            <Breadcrumbs
              items={[
                { label: 'Home', href: '/' },
                { label: 'Modules', href: '/modules' },
              ]}
              ariaLabel="Breadcrumb"
              linkAs={SmartLink}
            />
          </BreadcrumbBar>
        </PageShell.Breadcrumbs>
        <PageShell.Heading>
          <PageHeading
            headingBlock={{
              heading: 'Modules',
              supportingText: 'Every building block a page can be made from.',
            }}
          />
        </PageShell.Heading>
        <PageShell.Content>
          <div className="px-gutter py-section text-muted text-center">
            The first module starts its own section here
          </div>
        </PageShell.Content>
      </>
    ),
  },
};
