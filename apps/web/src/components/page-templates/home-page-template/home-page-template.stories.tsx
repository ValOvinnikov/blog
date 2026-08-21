import { BRAND_VARIANT } from '@blog/config';
import { LinkButton } from '@blog/ui/molecules';
import { Hero } from '@blog/ui/organisms';
import { en, Faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SmartLink } from '@web/components/shared/smart-link';
import { ContentModuleView } from '@web/modules/content/content-module-view';
import { CtaModuleView } from '@web/modules/cta/cta-module-view';
import { richTextDemo } from '@web/testing/shared/portable-text-renderer/fixtures';

import { HomePageTemplate } from './home-page-template';

// A private, seeded Faker instance keeps this value stable across runs
// without touching the global `faker` singleton other suites rely on.
const fixtureFaker = new Faker({ locale: [en] });
fixtureFaker.seed(123);
const heroMediaImageUrl = fixtureFaker.image.url({ width: 1200, height: 675 });

const meta = {
  title: 'Page Templates/HomePageTemplate',
  component: HomePageTemplate,
  tags: ['autodocs'],
  args: {
    hero: (
      <Hero
        eyebrow="Welcome"
        title="Notes on building things"
        titleId="hero-title"
        excerpt="Essays and notes from the team, published as we ship."
      >
        <Hero.Media>
          <img src={heroMediaImageUrl} alt="Placeholder hero image" />
        </Hero.Media>
        <Hero.Cta>
          <LinkButton as={SmartLink} href="/blog">
            Read the blog
          </LinkButton>
        </Hero.Cta>
      </Hero>
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
      <Hero
        eyebrow="Welcome"
        title="Notes on building things"
        titleId="hero-title"
        excerpt="Essays and notes from the team, published as we ship."
      />
    ),
    modules: (
      <div className="px-gutter py-section text-muted text-center">
        Page-builder modules render here
      </div>
    ),
  },
};
