import { BRAND_VARIANT, CONTENT_ALIGNMENT, MEDIA_ORDER } from '@blog/config';
import { CtaModule } from '@blog/ui/components/organisms/cta-module';
import { ctaModuleVariants } from '@blog/ui/components/organisms/cta-module/cta-module-variants';
import { CardStyles } from '@blog/ui/testing/card-styles';
import {
  MOCK_CTA_PRIMARY_AND_INLINE_LINK,
  MOCK_CTA_PRIMARY_AND_SECONDARY,
  mockCtaImage,
  mockCtaSlots,
} from '@blog/ui/testing/organisms/cta-module/fixtures';
import { objectKeys } from '@blog/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';

const SPLIT_COPY = {
  eyebrow: 'Pro plan',
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
  actions: MOCK_CTA_PRIMARY_AND_SECONDARY,
  footnote: 'No card required · cancel anytime',
  image: mockCtaImage('split-default'),
};

const meta = {
  title: 'Organisms/CtaModule/Split',
  component: CtaModule.Split,
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
    mobileMediaOrder: {
      control: 'select',
      options: objectKeys(ctaModuleVariants.variants.mobileMediaOrder),
    },
  },
  args: {
    tone: BRAND_VARIANT.PRIMARY,
    heading: 'Publish without the busywork',
    headingId: 'cta-module-heading',
    children: mockCtaSlots(SPLIT_COPY),
  },
} satisfies Meta<typeof CtaModule.Split>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const ImageLeft: TStory = {
  args: {
    tone: BRAND_VARIANT.SECONDARY,
    contentPosition: CONTENT_ALIGNMENT.RIGHT,
    heading: 'Support independent writing',
    children: mockCtaSlots({
      eyebrow: 'Membership',
      supportingText:
        'Members keep the archive open and ad-free, and get early access to new pieces.',
      actions: MOCK_CTA_PRIMARY_AND_INLINE_LINK,
      image: mockCtaImage('split-image-left'),
    }),
  },
};

export const MobileMediaFirst: TStory = {
  args: { mobileMediaOrder: MEDIA_ORDER.FIRST },
};

export const ByCardStyle: TStory = {
  render: (args) => (
    <CardStyles>
      {(cardStyle) =>
        objectKeys(ctaModuleVariants.variants.tone).map((tone) => (
          <CtaModule.Split
            key={tone}
            {...args}
            tone={tone}
            headingId={`cta-module-heading-${cardStyle}-${tone}`}
          />
        ))
      }
    </CardStyles>
  ),
};
