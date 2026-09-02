import { BRAND_VARIANT, CTA_VARIANT } from '@blog/config';
import { getSanityImageBaseUrl } from '@blog/service';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ContentModuleView } from '@web/modules/content/content-module-view';
import { CtaModuleView } from '@web/modules/cta/cta-module-view';
import { HeroModuleView } from '@web/modules/hero/hero-module-view';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { richTextDemo } from '@web/testing/shared/portable-text-renderer/fixtures';
import { STUB_IMAGE_TENANT } from '@web/testing/shared/tenant/fixtures';

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
        baseUrl={getSanityImageBaseUrl(STUB_IMAGE_TENANT)}
      />
    ),
    modules: (
      <>
        <ContentModuleView
          id="content-1"
          brandVariant={BRAND_VARIANT.PRIMARY}
          body={richTextDemo}
          layout={undefined}
          baseUrl={getSanityImageBaseUrl(STUB_IMAGE_TENANT)}
        />
        <CtaModuleView
          id="cta-1"
          variant={CTA_VARIANT.CALLOUT}
          brandVariant={BRAND_VARIANT.SECONDARY}
          eyebrow={undefined}
          sectionHeader={{
            heading: 'Never miss a post',
            supportingText:
              'Subscribe to get new articles on design systems and engineering delivered straight to your inbox.',
            align: undefined,
          }}
          content={undefined}
          image={undefined}
          imageSide={undefined}
          mobileMediaOrder={undefined}
          actions={ctaActionsDemo}
          footnote={undefined}
          layout={undefined}
          baseUrl={getSanityImageBaseUrl(STUB_IMAGE_TENANT)}
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
        baseUrl={getSanityImageBaseUrl(STUB_IMAGE_TENANT)}
      />
    ),
    modules: (
      <div className="px-gutter py-section text-muted text-center">
        Page-builder modules render here
      </div>
    ),
  },
};
