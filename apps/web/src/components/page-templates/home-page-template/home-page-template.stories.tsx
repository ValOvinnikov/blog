import { BRAND_VARIANT } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ContentModuleView } from '@web/modules/content/content-module-view';
import { CtaModuleView } from '@web/modules/cta/cta-module-view';
import { HeroModuleView } from '@web/modules/hero/hero-module-view';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { richTextDemo } from '@web/testing/shared/portable-text-renderer/fixtures';

import { HomePageTemplate } from './home-page-template';

const meta = {
  title: 'Page Templates/HomePageTemplate',
  component: HomePageTemplate,
  tags: ['autodocs'],
  args: {
    hero: (
      <HeroModuleView
        id="hero-1"
        brandVariant={BRAND_VARIANT.BRAND_PRIMARY}
        eyebrow="Welcome"
        title="Notes on building things"
        subtitle="Essays and notes from the team, published as we ship."
        sanityImage={makeSanityImage()}
        primaryAction={{
          label: 'Read the blog',
          href: '/blog',
          target: undefined,
          platform: undefined,
          hiddenLabelSuffix: undefined,
        }}
        secondaryAction={undefined}
        layout={undefined}
        projectId="demo-project"
        dataset="demo-dataset"
      />
    ),
    modules: (
      <>
        <ContentModuleView
          id="content-1"
          brandVariant={BRAND_VARIANT.PRIMARY}
          body={richTextDemo}
          layout={undefined}
        />
        <CtaModuleView
          id="cta-1"
          brandVariant={BRAND_VARIANT.SECONDARY}
          sectionHeader={{
            heading: 'Never miss a post',
            supportingText:
              'Subscribe to get new articles on design systems and engineering delivered straight to your inbox.',
            align: undefined,
          }}
          action={{
            label: 'Subscribe now',
            href: '/blog',
            target: undefined,
            platform: undefined,
            ariaLabel: undefined,
          }}
          layout={undefined}
        />
      </>
    ),
  },
} satisfies Meta<typeof HomePageTemplate>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const MinimalSlots: TStory = {
  args: {
    hero: (
      <HeroModuleView
        id="hero-1"
        brandVariant={BRAND_VARIANT.BRAND_PRIMARY}
        eyebrow="Welcome"
        title="Notes on building things"
        subtitle="Essays and notes from the team, published as we ship."
        sanityImage={undefined}
        primaryAction={undefined}
        secondaryAction={undefined}
        layout={undefined}
        projectId="demo-project"
        dataset="demo-dataset"
      />
    ),
    modules: (
      <div className="px-gutter py-section text-muted text-center">
        Page-builder modules render here
      </div>
    ),
  },
};
