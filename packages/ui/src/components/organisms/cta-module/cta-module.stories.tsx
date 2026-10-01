import {
  BRAND_VARIANT,
  CONTENT_ALIGNMENT,
  CTA_VARIANT,
  MEDIA_ORDER,
  SPACING_SCALE,
} from '@blog/config';
import { Button } from '@blog/ui/components/atoms/button';
import { objectKeys } from '@blog/utils/primitives';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { CtaModule } from './cta-module';
import { ctaModuleVariants } from './cta-module-variants';

const image = (seed: string) => (
  <img
    src={faker.image.urlPicsumPhotos({ width: 1200, height: 900 })}
    alt=""
    key={seed}
  />
);

// Stub — this package never constructs a link/button; the web layer would
// pass its own `ActionGroup` output here.
const PrimaryAndSecondary = (
  <>
    <Button variant="primary">Start reading</Button>
    <Button variant="ghost">Compare plans</Button>
  </>
);

const PrimaryOnly = <Button variant="primary">Subscribe</Button>;

const PrimaryAndInlineLink = (
  <>
    <Button variant="primary">Reserve a seat</Button>
    <Button variant="link">See the schedule</Button>
  </>
);

const meta = {
  title: 'Organisms/CtaModule',
  component: CtaModule,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    variant: {
      control: 'select',
      options: objectKeys(ctaModuleVariants.variants.variant),
    },
    tone: {
      control: 'select',
      options: objectKeys(ctaModuleVariants.variants.tone),
    },
    contentPosition: {
      control: 'select',
      options: objectKeys(ctaModuleVariants.variants.position),
    },
    contentAlignment: {
      control: 'select',
      options: objectKeys(ctaModuleVariants.variants.alignment),
    },
    mobileMediaOrder: {
      control: 'select',
      options: objectKeys(ctaModuleVariants.variants.mobileMediaOrder),
    },
    spacingTop: {
      control: 'select',
      options: objectKeys(ctaModuleVariants.variants.spacingTop),
    },
    spacingBottom: {
      control: 'select',
      options: objectKeys(ctaModuleVariants.variants.spacingBottom),
    },
  },
  args: {
    variant: CTA_VARIANT.CALLOUT,
    tone: BRAND_VARIANT.BRAND_PRIMARY,
    eyebrow: 'Newsletter',
    heading: 'Never miss a post',
    headingId: 'cta-module-heading',
    supportingText: 'Get new essays the morning they go live.',
    actions: PrimaryOnly,
    footnote: '2,400+ readers · one email a week',
  },
} satisfies Meta<typeof CtaModule>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const CalloutDefault: TStory = {
  args: { image: image('callout-default') },
};

export const CalloutNoImage: TStory = {
  args: {
    tone: BRAND_VARIANT.SECONDARY,
    eyebrow: undefined,
    heading: 'Getting started takes three steps',
    supportingText: undefined,
    content: (
      <ol>
        <li>Create your publication</li>
        <li>Import or write your first post</li>
        <li>Share the link — that&apos;s it</li>
      </ol>
    ),
    image: undefined,
    footnote: undefined,
    actions: PrimaryAndInlineLink,
  },
};

export const CalloutTonePrimary: TStory = {
  args: {
    tone: BRAND_VARIANT.PRIMARY,
    image: undefined,
    footnote: undefined,
  },
};

export const SplitDefault: TStory = {
  args: {
    variant: CTA_VARIANT.SPLIT,
    tone: BRAND_VARIANT.PRIMARY,
    eyebrow: 'Pro plan',
    heading: 'Publish without the busywork',
    supportingText: undefined,
    content: (
      <>
        <p>Everything a growing publication needs:</p>
        <ul>
          <li>Scheduling for posts &amp; newsletters</li>
          <li>Audience analytics dashboard</li>
          <li>Two editor seats included</li>
        </ul>
      </>
    ),
    actions: PrimaryAndSecondary,
    footnote: 'No card required · cancel anytime',
    image: image('split-default'),
  },
};

export const SplitImageLeft: TStory = {
  args: {
    ...SplitDefault.args,
    tone: BRAND_VARIANT.SECONDARY,
    contentPosition: CONTENT_ALIGNMENT.RIGHT,
    eyebrow: 'Membership',
    heading: 'Support independent writing',
    content: undefined,
    supportingText:
      'Members keep the archive open and ad-free, and get early access to new pieces.',
    actions: PrimaryAndInlineLink,
    footnote: undefined,
    image: image('split-image-left'),
  },
};

export const SplitMobileMediaFirst: TStory = {
  args: {
    ...SplitDefault.args,
    mobileMediaOrder: MEDIA_ORDER.FIRST,
  },
};

export const BannerDefault: TStory = {
  args: {
    variant: CTA_VARIANT.BANNER,
    tone: BRAND_VARIANT.BRAND_PRIMARY,
    contentPosition: CONTENT_ALIGNMENT.LEFT,
    contentAlignment: CONTENT_ALIGNMENT.LEFT,
    eyebrow: 'Get the book',
    heading: 'The whole system, on paper',
    supportingText:
      '320 pages on building a writing practice that lasts. Print and ebook, DRM-free.',
    actions: PrimaryAndSecondary,
    footnote: 'Ships worldwide · 30-day returns',
    image: image('banner-default'),
  },
};

export const BannerNeutralTint: TStory = {
  args: {
    ...BannerDefault.args,
    tone: BRAND_VARIANT.PRIMARY,
    contentPosition: CONTENT_ALIGNMENT.CENTER,
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
    eyebrow: undefined,
    heading: 'Join 12,000 readers',
    supportingText:
      'A calmer way to keep up with what matters in tech and craft.',
    actions: PrimaryOnly,
    footnote: undefined,
  },
};

export const BannerAlignRight: TStory = {
  args: {
    ...BannerDefault.args,
    tone: BRAND_VARIANT.SECONDARY,
    contentPosition: CONTENT_ALIGNMENT.RIGHT,
    contentAlignment: CONTENT_ALIGNMENT.RIGHT,
    eyebrow: 'Workshop',
    heading: 'Two days, one craft',
    supportingText:
      'A hands-on writing intensive. Small cohort, live feedback.',
    actions: PrimaryAndInlineLink,
    footnote: undefined,
    // Fixed bright photo, not the random `image()` helper — the right-side scrim needs a reliably bright backdrop to demonstrate its contrast.
    image: (
      <img
        src="https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1600&h=900&fit=crop"
        alt=""
      />
    ),
  },
};

export const BannerSpacingNone: TStory = {
  args: {
    ...BannerDefault.args,
    spacingTop: SPACING_SCALE.NONE,
    spacingBottom: SPACING_SCALE.NONE,
  },
};

export const BannerSpacingMd: TStory = {
  args: {
    ...BannerDefault.args,
    spacingTop: SPACING_SCALE.MD,
    spacingBottom: SPACING_SCALE.MD,
  },
};

export const BannerSpacingXl: TStory = {
  args: {
    ...BannerDefault.args,
    spacingTop: SPACING_SCALE.XL,
    spacingBottom: SPACING_SCALE.XL,
  },
};

export const BannerPositionBySpacing: TStory = {
  args: { ...BannerDefault.args },
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div className="flex flex-col gap-10">
      {objectKeys(ctaModuleVariants.variants.position).map((position) =>
        objectKeys(ctaModuleVariants.variants.spacingTop).map((spacing) => (
          <CtaModule
            key={`${position}-${spacing}`}
            {...args}
            heading={`${position} / ${spacing}`}
            contentPosition={position}
            contentAlignment={position}
            spacingTop={spacing}
            spacingBottom={spacing}
          />
        )),
      )}
    </div>
  ),
};

export const BannerMismatchedPositionAndAlignment: TStory = {
  args: { ...BannerDefault.args },
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div className="flex flex-col gap-10">
      {objectKeys(ctaModuleVariants.variants.position).map((position) =>
        objectKeys(ctaModuleVariants.variants.alignment)
          .filter((alignment) => alignment !== position)
          .map((alignment) => (
            <CtaModule
              key={`${position}-${alignment}`}
              {...args}
              heading={`${position} position / ${alignment} text`}
              contentPosition={position}
              contentAlignment={alignment}
            />
          )),
      )}
    </div>
  ),
};

export const Wrapped: TStory = {
  args: {
    isWrapped: true,
    image: undefined,
    footnote: undefined,
  },
};
