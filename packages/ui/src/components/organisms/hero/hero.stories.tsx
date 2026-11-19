import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  HERO_VARIANT,
  ICONS,
  MEDIA_ORDER,
  SIZE,
  SOCIAL_PLATFORM_LABEL,
  SOCIAL_PLATFORMS,
  SPACING_SCALE,
} from '@shinefold/config';
import { Avatar } from '@shinefold/ui/components/atoms/avatar';
import { Icon } from '@shinefold/ui/components/atoms/icon';
import { TextLink } from '@shinefold/ui/components/atoms/text-link';
import { ShareLink } from '@shinefold/ui/components/molecules/share-link';
import { EveryBrandBand } from '@shinefold/ui/testing/brand-bands';
import { objectKeys } from '@shinefold/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Hero } from './hero';
import { heroVariants } from './hero-variants';

const PROFILE_EYEBROW = 'Senior frontend engineer';
const PROFILE_EXCERPT =
  'Architecture, performance, and design systems — from fintech and retail.';
const BANNER_IMAGE_ALT = 'Bright mountain sunrise';

const bannerContent = (alt: string) => (
  <>
    <Hero.Media>
      <img
        src="https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1600&h=900&fit=crop"
        alt={alt}
        className="size-full object-cover"
      />
    </Hero.Media>
    <Hero.Cta>
      <TextLink appearance="nav" href="/posts/design-system">
        Read more
      </TextLink>
    </Hero.Cta>
  </>
);

const profileContent = (
  <>
    <Hero.Avatar>
      <Avatar
        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop"
        alt="Portrait of Jane Doe"
        name="Jane Doe"
        size={SIZE.XXL}
      />
    </Hero.Avatar>
    <Hero.Body>
      <p>
        Jane leads platform engineering, with a decade of shipping design
        systems used across fintech and retail. She writes about the boring
        parts that make software fast: caching, build graphs, and saying no to
        abstractions.
      </p>
      <p>
        Off the clock she maintains open-source tooling and mentors engineers
        moving into staff roles.
      </p>
    </Hero.Body>
    <Hero.Cta>
      <TextLink appearance="nav" href="/posts/design-system">
        Read more
      </TextLink>
    </Hero.Cta>
    <Hero.Social>
      <ul aria-label="Find Jane Doe elsewhere">
        <li>
          <ShareLink
            href="https://github.com/janedoe"
            label={SOCIAL_PLATFORM_LABEL[SOCIAL_PLATFORMS.GITHUB]}
            icon={<Icon name={ICONS.GITHUB} size={SIZE.SM} />}
          />
        </li>
        <li>
          <ShareLink
            href="https://linkedin.com/in/janedoe"
            label={SOCIAL_PLATFORM_LABEL[SOCIAL_PLATFORMS.LINKEDIN]}
            icon={<Icon name={ICONS.LINKEDIN} size={SIZE.SM} />}
          />
        </li>
        <li>
          <ShareLink
            href="https://x.com/janedoe"
            label={SOCIAL_PLATFORM_LABEL[SOCIAL_PLATFORMS.X]}
            icon={<Icon name={ICONS.X} size={SIZE.SM} />}
          />
        </li>
      </ul>
    </Hero.Social>
  </>
);

const meta = {
  title: 'Organisms/Hero',
  component: Hero,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: objectKeys(heroVariants.variants.variant),
    },
    tone: {
      control: 'select',
      options: objectKeys(BRAND_VARIANT),
    },
  },
  args: {
    eyebrow: 'Architecture',
    title: 'Building a Design System from Scratch',
    excerpt:
      'A deep dive into Atomic Design principles, Tailwind CSS v4, and class-variance-authority — all working together in a portable component library.',
    titleId: 'hero-title',
    tone: BRAND_VARIANT.PRIMARY,
    children: (
      <>
        <Hero.Media>
          <img
            src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&h=675&fit=crop"
            alt="Code editor showing component code"
            className="size-full object-cover"
          />
        </Hero.Media>
        <Hero.Cta>
          <TextLink appearance="nav" href="/posts/design-system">
            Read more
          </TextLink>
        </Hero.Cta>
      </>
    ),
  },
} satisfies Meta<typeof Hero>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Full: TStory = {};

export const Minimal: TStory = {
  args: {
    eyebrow: PROFILE_EYEBROW,
    title: 'Notes on shipping frontend at scale',
    excerpt:
      'Architecture, performance, and design systems — from fintech and retail. Written, not generated.',
    children: undefined,
  },
};

export const WithoutEyebrow: TStory = {
  args: {
    eyebrow: undefined,
    children: (
      <Hero.Cta>
        <TextLink appearance="nav" href="/posts/design-system">
          Read more
        </TextLink>
      </Hero.Cta>
    ),
  },
};

export const WithoutImage: TStory = {
  args: {
    children: (
      <Hero.Cta>
        <TextLink appearance="nav" href="/posts/design-system">
          Read more
        </TextLink>
      </Hero.Cta>
    ),
  },
};

export const SplitContentLeft: TStory = {
  args: {
    variant: HERO_VARIANT.SPLIT,
    layout: {
      contentPosition: CONTENT_ALIGNMENT.LEFT,
    },
  },
};

export const SplitContentRight: TStory = {
  args: {
    variant: HERO_VARIANT.SPLIT,
    layout: {
      contentPosition: CONTENT_ALIGNMENT.RIGHT,
    },
  },
};

export const SplitContentAlignmentRight: TStory = {
  args: {
    variant: HERO_VARIANT.SPLIT,
    layout: {
      contentAlignment: CONTENT_ALIGNMENT.RIGHT,
    },
  },
};

export const SplitContentAlignmentCenter: TStory = {
  args: {
    variant: HERO_VARIANT.SPLIT,
    layout: {
      contentAlignment: CONTENT_ALIGNMENT.CENTER,
    },
  },
};

export const StackedDefault: TStory = {
  args: {
    variant: HERO_VARIANT.STACKED,
  },
};

export const StackedContentAlignmentLeft: TStory = {
  args: {
    variant: HERO_VARIANT.STACKED,
    layout: {
      contentAlignment: CONTENT_ALIGNMENT.LEFT,
    },
  },
};

export const StackedContentAlignmentRight: TStory = {
  args: {
    variant: HERO_VARIANT.STACKED,
    layout: {
      contentAlignment: CONTENT_ALIGNMENT.RIGHT,
    },
  },
};

export const StackedContentAlignmentCenter: TStory = {
  args: {
    variant: HERO_VARIANT.STACKED,
    layout: {
      contentAlignment: CONTENT_ALIGNMENT.CENTER,
    },
  },
};

export const BannerContentLeft: TStory = {
  args: {
    variant: HERO_VARIANT.BANNER,
    tone: BRAND_VARIANT.BRAND_PRIMARY,
    layout: {
      contentPosition: CONTENT_ALIGNMENT.LEFT,
      contentAlignment: CONTENT_ALIGNMENT.LEFT,
    },
    children: bannerContent(BANNER_IMAGE_ALT),
  },
};

export const BannerWithBody: TStory = {
  args: {
    variant: HERO_VARIANT.BANNER,
    tone: BRAND_VARIANT.BRAND_PRIMARY,
    layout: {
      contentPosition: CONTENT_ALIGNMENT.LEFT,
      contentAlignment: CONTENT_ALIGNMENT.LEFT,
    },
    children: (
      <>
        <Hero.Media>
          <img
            src="https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1600&h=900&fit=crop"
            alt={BANNER_IMAGE_ALT}
            className="size-full object-cover"
          />
        </Hero.Media>
        <Hero.Body>
          <p>
            Six months building this system in public — every decision, every
            rollback, every lesson that didn&apos;t make the changelog.
          </p>
        </Hero.Body>
        <Hero.Cta>
          <TextLink appearance="nav" href="/posts/design-system">
            Read more
          </TextLink>
        </Hero.Cta>
      </>
    ),
  },
};

export const BannerContentCenter: TStory = {
  args: {
    variant: HERO_VARIANT.BANNER,
    tone: BRAND_VARIANT.PRIMARY,
    layout: {
      contentPosition: CONTENT_ALIGNMENT.CENTER,
      contentAlignment: CONTENT_ALIGNMENT.CENTER,
    },
    children: bannerContent(BANNER_IMAGE_ALT),
  },
};

export const BannerContentRight: TStory = {
  args: {
    variant: HERO_VARIANT.BANNER,
    tone: BRAND_VARIANT.SECONDARY,
    layout: {
      contentPosition: CONTENT_ALIGNMENT.RIGHT,
      contentAlignment: CONTENT_ALIGNMENT.RIGHT,
    },
    children: bannerContent(BANNER_IMAGE_ALT),
  },
};

export const BannerToneBrandPrimary: TStory = {
  args: {
    variant: HERO_VARIANT.BANNER,
    tone: BRAND_VARIANT.BRAND_PRIMARY,
    layout: {
      contentPosition: CONTENT_ALIGNMENT.LEFT,
      contentAlignment: CONTENT_ALIGNMENT.LEFT,
    },
    children: bannerContent(BANNER_IMAGE_ALT),
  },
};

export const BannerTonePrimary: TStory = {
  args: {
    variant: HERO_VARIANT.BANNER,
    tone: BRAND_VARIANT.PRIMARY,
    layout: {
      contentPosition: CONTENT_ALIGNMENT.LEFT,
      contentAlignment: CONTENT_ALIGNMENT.LEFT,
    },
    children: bannerContent(BANNER_IMAGE_ALT),
  },
};

export const BannerToneSecondary: TStory = {
  args: {
    variant: HERO_VARIANT.BANNER,
    tone: BRAND_VARIANT.SECONDARY,
    layout: {
      contentPosition: CONTENT_ALIGNMENT.LEFT,
      contentAlignment: CONTENT_ALIGNMENT.LEFT,
    },
    children: bannerContent(BANNER_IMAGE_ALT),
  },
};

export const BannerToneSecondaryWideDesktop: TStory = {
  ...BannerToneSecondary,
  parameters: { layout: 'fullscreen' },
  globals: { viewport: 'wideDesktop' },
};

const bannerWithoutMediaContent = (
  <Hero.Cta>
    <TextLink appearance="nav" href="/posts/design-system">
      Read more
    </TextLink>
  </Hero.Cta>
);

export const BannerWithoutMediaTonePrimary: TStory = {
  args: {
    variant: HERO_VARIANT.BANNER,
    tone: BRAND_VARIANT.PRIMARY,
    children: bannerWithoutMediaContent,
  },
};

export const BannerWithoutMediaToneSecondary: TStory = {
  args: {
    ...BannerWithoutMediaTonePrimary.args,
    tone: BRAND_VARIANT.SECONDARY,
  },
};

export const BannerWithoutMediaToneBrandPrimary: TStory = {
  args: {
    ...BannerWithoutMediaTonePrimary.args,
    tone: BRAND_VARIANT.BRAND_PRIMARY,
  },
};

export const BannerWithoutMediaTonePrimaryDark: TStory = {
  ...BannerWithoutMediaTonePrimary,
  globals: { theme: 'dark' },
};

export const BannerWithoutMediaToneSecondaryDark: TStory = {
  ...BannerWithoutMediaToneSecondary,
  globals: { theme: 'dark' },
};

export const BannerWithoutMediaToneBrandPrimaryDark: TStory = {
  ...BannerWithoutMediaToneBrandPrimary,
  globals: { theme: 'dark' },
};

const bannerProfileContent = (hasMedia: boolean) => (
  <>
    {hasMedia && (
      <Hero.Media>
        <img
          src="https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1600&h=900&fit=crop"
          alt=""
          className="size-full object-cover"
        />
      </Hero.Media>
    )}
    <Hero.Cta>
      <TextLink appearance="nav" href="/posts/design-system">
        Read more
      </TextLink>
    </Hero.Cta>
    <Hero.Social>
      <ul aria-label="Find Jane Doe elsewhere">
        <li>
          <ShareLink
            href="https://github.com/janedoe"
            label={SOCIAL_PLATFORM_LABEL[SOCIAL_PLATFORMS.GITHUB]}
            icon={<Icon name={ICONS.GITHUB} size={SIZE.SM} />}
            className="text-on-image"
          />
        </li>
        <li>
          <ShareLink
            href="https://linkedin.com/in/janedoe"
            label={SOCIAL_PLATFORM_LABEL[SOCIAL_PLATFORMS.LINKEDIN]}
            icon={<Icon name={ICONS.LINKEDIN} size={SIZE.SM} />}
            className="text-on-image"
          />
        </li>
      </ul>
    </Hero.Social>
  </>
);

export const BannerProfileWithoutMedia: TStory = {
  args: {
    variant: HERO_VARIANT.BANNER,
    tone: BRAND_VARIANT.SECONDARY,
    eyebrow: 'Platform engineering',
    title: 'Jane Doe',
    excerpt: 'Staff engineer',
    children: bannerProfileContent(false),
  },
};

export const BannerProfileWithoutMediaDark: TStory = {
  ...BannerProfileWithoutMedia,
  globals: { theme: 'dark' },
};

export const BannerProfileWithMediaTonePrimary: TStory = {
  args: {
    ...BannerProfileWithoutMedia.args,
    tone: BRAND_VARIANT.PRIMARY,
    children: bannerProfileContent(true),
  },
};

export const BannerProfileWithMediaToneSecondary: TStory = {
  args: {
    ...BannerProfileWithMediaTonePrimary.args,
    tone: BRAND_VARIANT.SECONDARY,
  },
};

export const BannerProfileWithMediaToneBrandPrimary: TStory = {
  args: {
    ...BannerProfileWithMediaTonePrimary.args,
    tone: BRAND_VARIANT.BRAND_PRIMARY,
  },
};

export const BannerSpacingNone: TStory = {
  args: {
    ...BannerContentLeft.args,
    layout: {
      ...BannerContentLeft.args?.layout,
      spacingTop: SPACING_SCALE.NONE,
      spacingBottom: SPACING_SCALE.NONE,
    },
  },
};

export const BannerSpacingMd: TStory = {
  args: {
    ...BannerContentLeft.args,
    layout: {
      ...BannerContentLeft.args?.layout,
      spacingTop: SPACING_SCALE.MD,
      spacingBottom: SPACING_SCALE.MD,
    },
  },
};

export const BannerSpacingXl: TStory = {
  args: {
    ...BannerContentLeft.args,
    layout: {
      ...BannerContentLeft.args?.layout,
      spacingTop: SPACING_SCALE.XL,
      spacingBottom: SPACING_SCALE.XL,
    },
  },
};

export const BannerHeadingOnly: TStory = {
  args: {
    variant: HERO_VARIANT.BANNER,
    tone: BRAND_VARIANT.PRIMARY,
    excerpt: undefined,
    eyebrow: undefined,
    children: undefined,
  },
};

export const StackedAtLg: TStory = {
  args: {
    variant: HERO_VARIANT.STACKED,
  },
  globals: { viewport: 'desktop' },
};

export const StackedMediaFirstAtLg: TStory = {
  args: {
    variant: HERO_VARIANT.STACKED,
    layout: {
      mediaOrder: MEDIA_ORDER.FIRST,
    },
  },
  globals: { viewport: 'desktop' },
};

export const SplitMediaOrderFirst: TStory = {
  args: {
    variant: HERO_VARIANT.SPLIT,
    layout: {
      mediaOrder: MEDIA_ORDER.FIRST,
    },
  },
};

export const SplitMediaOrderLast: TStory = {
  args: {
    variant: HERO_VARIANT.SPLIT,
    layout: {
      mediaOrder: MEDIA_ORDER.LAST,
    },
  },
};

export const StackedMediaOrderFirst: TStory = {
  args: {
    variant: HERO_VARIANT.STACKED,
    layout: {
      mediaOrder: MEDIA_ORDER.FIRST,
    },
  },
};

export const StackedMediaOrderLast: TStory = {
  args: {
    variant: HERO_VARIANT.STACKED,
    layout: {
      mediaOrder: MEDIA_ORDER.LAST,
    },
  },
};

export const StackedProfileToneBrandPrimary: TStory = {
  args: {
    variant: HERO_VARIANT.STACKED,
    tone: BRAND_VARIANT.BRAND_PRIMARY,
    eyebrow: PROFILE_EYEBROW,
    title: 'Jane Doe',
    excerpt: PROFILE_EXCERPT,
    children: profileContent,
  },
};

export const StackedProfileTonePrimary: TStory = {
  args: {
    variant: HERO_VARIANT.STACKED,
    tone: BRAND_VARIANT.PRIMARY,
    eyebrow: PROFILE_EYEBROW,
    title: 'Jane Doe',
    excerpt: PROFILE_EXCERPT,
    children: profileContent,
  },
};

export const StackedProfileToneSecondary: TStory = {
  args: {
    variant: HERO_VARIANT.STACKED,
    tone: BRAND_VARIANT.SECONDARY,
    eyebrow: PROFILE_EYEBROW,
    title: 'Jane Doe',
    excerpt: PROFILE_EXCERPT,
    children: profileContent,
  },
};

export const CenteredActions: TStory = {
  args: {
    variant: HERO_VARIANT.STACKED,
    layout: {
      contentAlignment: CONTENT_ALIGNMENT.CENTER,
    },
    children: (
      <Hero.Cta>
        <TextLink appearance="nav" href="/posts/design-system">
          Read more
        </TextLink>
        <TextLink appearance="nav" href="/about">
          About the author
        </TextLink>
      </Hero.Cta>
    ),
  },
};

export const SplitSquarePortrait: TStory = {
  args: {
    variant: HERO_VARIANT.SPLIT,
    children: (
      <>
        <Hero.Media ratio="square">
          <img
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&h=800&fit=crop"
            alt="Portrait of Jane Doe"
            className="size-full object-cover"
          />
        </Hero.Media>
        <Hero.Cta>
          <TextLink appearance="nav" href="/posts/design-system">
            Read more
          </TextLink>
        </Hero.Cta>
      </>
    ),
  },
};

export const SplitSquarePortraitPhone: TStory = {
  ...SplitSquarePortrait,
  globals: { viewport: 'phone' },
};

export const SplitSquarePortraitTablet: TStory = {
  ...SplitSquarePortrait,
  globals: { viewport: 'tablet' },
};

export const SplitSquarePortraitCenterTablet: TStory = {
  args: {
    ...SplitSquarePortrait.args,
    layout: {
      contentAlignment: CONTENT_ALIGNMENT.CENTER,
    },
  },
  globals: { viewport: 'tablet' },
};

export const SplitAndStackedOnEveryBrandBand: TStory = {
  render: (args) => (
    <EveryBrandBand>
      {(tone) =>
        [HERO_VARIANT.SPLIT, HERO_VARIANT.STACKED].map((variant) => (
          <Hero
            key={variant}
            {...args}
            variant={variant}
            titleId={`hero-title-${tone}-${variant}`}
          />
        ))
      }
    </EveryBrandBand>
  ),
};
