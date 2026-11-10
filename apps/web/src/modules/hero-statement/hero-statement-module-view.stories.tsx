import { BRAND_VARIANT, HERO_VARIANT } from '@blog/config';
import type { THeroStatementModule } from '@blog/service';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MOCK_CTA_ACTIONS } from '@web/testing/modules/cta/fixtures';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockHeroStatementModule } from '@web/testing/modules/hero-statement/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { mockHeroPresentation } from '@web/testing/shared/hero-presentation/fixtures';

import { HeroStatementModuleView } from './hero-statement-module-view';

const storyModule = (
  overrides: Partial<THeroStatementModule> = {},
): THeroStatementModule =>
  mockHeroStatementModule({
    brandVariant: BRAND_VARIANT.BRAND_PRIMARY,
    eyebrow: 'Now shipping',
    headingBlock: mockHeadingBlock({
      heading: 'Build faster, ship sooner',
      supportingText:
        'A marketing hero for a landing or home page — an authored statement rather than a resolved post, with zero, one, or two authored actions.',
    }),
    sanityImage: mockSanityImage(),
    ctaButtons: MOCK_CTA_ACTIONS.slice(0, 1),
    ...overrides,
  });

const meta = {
  title: 'Modules/HeroStatementModule',
  component: HeroStatementModuleView,
  tags: ['autodocs'],
  args: {
    id: 'hero-statement-1',
    module: storyModule(),
  },
} satisfies Meta<typeof HeroStatementModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const NoActions: TStory = {
  args: {
    module: storyModule({
      ctaButtons: [],
    }),
  },
};

export const TwoActions: TStory = {
  args: {
    module: storyModule({
      ctaButtons: MOCK_CTA_ACTIONS,
    }),
  },
};

export const Stacked: TStory = {
  args: {
    module: storyModule({
      presentation: mockHeroPresentation({ variant: HERO_VARIANT.STACKED }),
    }),
  },
};

export const Banner: TStory = {
  args: {
    module: storyModule({
      presentation: mockHeroPresentation({ variant: HERO_VARIANT.BANNER }),
      ctaButtons: MOCK_CTA_ACTIONS,
    }),
  },
};
