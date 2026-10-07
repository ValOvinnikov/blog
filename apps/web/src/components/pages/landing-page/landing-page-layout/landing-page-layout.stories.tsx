import { BRAND_VARIANT, HERO_VARIANT, type THeroVariant } from '@blog/config';
import { Breadcrumbs } from '@blog/ui/components/molecules/breadcrumbs';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { BreadcrumbBar } from '@web/components/shared/breadcrumb-bar';
import { PageHeading } from '@web/components/shared/page-heading';
import { SmartLink } from '@web/components/shared/smart-link';
import { HeroBlogModuleView } from '@web/modules/hero-blog/hero-blog-module-view';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeLandingSectionNavigation } from '@web/testing/pages/landing-page/fixtures';

import { LandingPageLayout } from './landing-page-layout';

const makeHero = (variant: THeroVariant) => (
  <HeroBlogModuleView
    id="hero-1"
    hasPost={true}
    brandVariant={BRAND_VARIANT.PRIMARY}
    variant={variant}
    eyebrow="Modules"
    heading="Blog hero — split, media left"
    supportingText="One full-width block opens the page, above the section navigation."
    sanityImage={makeSanityImage()}
    ctaButtons={[]}
    contentPosition={undefined}
    contentAlignment={undefined}
    mediaOrder={undefined}
    layout={undefined}
  />
);

const meta = {
  title: 'Pages/Landing/LandingPageLayout',
  component: LandingPageLayout,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    topBlock: (
      <PageHeading
        headingBlock={{
          heading: 'Blog hero',
          supportingText: 'Every way the blog hero can open a page.',
        }}
      />
    ),
    breadcrumbs: (
      <BreadcrumbBar>
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Modules', href: '/modules' },
            { label: 'Blog hero', href: '/modules/blog-hero' },
          ]}
          ariaLabel="Breadcrumb"
          linkAs={SmartLink}
        />
      </BreadcrumbBar>
    ),
    sectionNavigation: makeLandingSectionNavigation(),
    children: (
      <div className="py-section text-muted text-center">
        Page modules render here
      </div>
    ),
  },
} satisfies Meta<typeof LandingPageLayout>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const SectionedWithHeading: TStory = {};

export const SectionedWithSplitHero: TStory = {
  args: { topBlock: makeHero(HERO_VARIANT.SPLIT) },
};

export const SectionedWithStackedHero: TStory = {
  args: { topBlock: makeHero(HERO_VARIANT.STACKED) },
};

export const SectionedWithBannerHero: TStory = {
  args: { topBlock: makeHero(HERO_VARIANT.BANNER) },
};

export const WithoutSection: TStory = {
  args: { sectionNavigation: undefined },
};

export const MobileWithHero: TStory = {
  args: { topBlock: makeHero(HERO_VARIANT.SPLIT) },
  globals: { viewport: 'mobile' },
};
