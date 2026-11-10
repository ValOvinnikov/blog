import { BRAND_VARIANT, CONTENT_ALIGNMENT, SPACING_SCALE } from '@blog/config';
import { CtaModule } from '@blog/ui/components/organisms/cta-module';
import { ctaModuleVariants } from '@blog/ui/components/organisms/cta-module/cta-module-variants';
import {
  MOCK_CTA_BRIGHT_PHOTO,
  MOCK_CTA_PRIMARY_AND_INLINE_LINK,
  MOCK_CTA_PRIMARY_AND_SECONDARY,
  MOCK_CTA_PRIMARY_ONLY,
  mockCtaImage,
  mockCtaSlots,
} from '@blog/ui/testing/organisms/cta-module/fixtures';
import { objectKeys } from '@blog/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';

const BANNER_COPY = {
  eyebrow: 'Get the book',
  supportingText:
    '320 pages on building a writing practice that lasts. Print and ebook, DRM-free.',
  actions: MOCK_CTA_PRIMARY_AND_SECONDARY,
  footnote: 'Ships worldwide · 30-day returns',
  image: mockCtaImage('banner-default'),
};

const meta = {
  title: 'Organisms/CtaModule/Banner',
  component: CtaModule.Banner,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
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
    spacingTop: {
      control: 'select',
      options: objectKeys(SPACING_SCALE),
    },
    spacingBottom: {
      control: 'select',
      options: objectKeys(SPACING_SCALE),
    },
  },
  args: {
    tone: BRAND_VARIANT.BRAND_PRIMARY,
    contentPosition: CONTENT_ALIGNMENT.LEFT,
    contentAlignment: CONTENT_ALIGNMENT.LEFT,
    heading: 'The whole system, on paper',
    headingId: 'cta-module-heading',
    children: mockCtaSlots(BANNER_COPY),
  },
} satisfies Meta<typeof CtaModule.Banner>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const OverBrightPhoto: TStory = {
  args: {
    children: mockCtaSlots({ ...BANNER_COPY, image: MOCK_CTA_BRIGHT_PHOTO }),
  },
};

export const NeutralTint: TStory = {
  args: {
    tone: BRAND_VARIANT.PRIMARY,
    contentPosition: CONTENT_ALIGNMENT.CENTER,
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
    heading: 'Join 12,000 readers',
    children: mockCtaSlots({
      supportingText:
        'A calmer way to keep up with what matters in tech and craft.',
      actions: MOCK_CTA_PRIMARY_ONLY,
      image: BANNER_COPY.image,
    }),
  },
};

export const AlignRight: TStory = {
  args: {
    tone: BRAND_VARIANT.SECONDARY,
    contentPosition: CONTENT_ALIGNMENT.RIGHT,
    contentAlignment: CONTENT_ALIGNMENT.RIGHT,
    heading: 'Two days, one craft',
    children: mockCtaSlots({
      eyebrow: 'Workshop',
      supportingText:
        'A hands-on writing intensive. Small cohort, live feedback.',
      actions: MOCK_CTA_PRIMARY_AND_INLINE_LINK,
      image: MOCK_CTA_BRIGHT_PHOTO,
    }),
  },
};

export const SpacingNone: TStory = {
  args: {
    spacingTop: SPACING_SCALE.NONE,
    spacingBottom: SPACING_SCALE.NONE,
  },
};

export const SpacingMd: TStory = {
  args: {
    spacingTop: SPACING_SCALE.MD,
    spacingBottom: SPACING_SCALE.MD,
  },
};

export const SpacingXl: TStory = {
  args: {
    spacingTop: SPACING_SCALE.XL,
    spacingBottom: SPACING_SCALE.XL,
  },
};

export const PositionBySpacing: TStory = {
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div className="flex flex-col gap-10">
      {objectKeys(ctaModuleVariants.variants.position).map((position) =>
        objectKeys(SPACING_SCALE).map((spacing) => (
          <CtaModule.Banner
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

export const MismatchedPositionAndAlignment: TStory = {
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <div className="flex flex-col gap-10">
      {objectKeys(ctaModuleVariants.variants.position).map((position) =>
        objectKeys(ctaModuleVariants.variants.alignment)
          .filter((alignment) => alignment !== position)
          .map((alignment) => (
            <CtaModule.Banner
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

export const PositionBySpacingPhone: TStory = {
  ...PositionBySpacing,
  globals: { viewport: 'phone' },
};

export const MismatchedPositionAndAlignmentPhone: TStory = {
  ...MismatchedPositionAndAlignment,
  globals: { viewport: 'phone' },
};
