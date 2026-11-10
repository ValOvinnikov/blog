import { BRAND_VARIANT, CONTENT_ALIGNMENT } from '@blog/config';
import { CtaModule } from '@blog/ui/components/organisms/cta-module';
import { ctaModuleVariants } from '@blog/ui/components/organisms/cta-module/cta-module-variants';
import { CardStyles } from '@blog/ui/testing/card-styles';
import {
  MOCK_CTA_PRIMARY_AND_INLINE_LINK,
  MOCK_CTA_PRIMARY_ONLY,
  mockCtaImage,
  mockCtaSlots,
} from '@blog/ui/testing/organisms/cta-module/fixtures';
import { objectKeys } from '@blog/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';

const CALLOUT_COPY = {
  eyebrow: 'Newsletter',
  supportingText: 'Get new essays the morning they go live.',
  actions: MOCK_CTA_PRIMARY_ONLY,
  footnote: '2,400+ readers · one email a week',
};

const meta = {
  title: 'Organisms/CtaModule/Callout',
  component: CtaModule.Callout,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    tone: {
      control: 'select',
      options: objectKeys(ctaModuleVariants.variants.tone),
    },
    contentAlignment: {
      control: 'select',
      options: objectKeys(ctaModuleVariants.variants.alignment),
    },
  },
  args: {
    tone: BRAND_VARIANT.BRAND_PRIMARY,
    heading: 'Never miss a post',
    headingId: 'cta-module-heading',
    children: mockCtaSlots(CALLOUT_COPY),
  },
} satisfies Meta<typeof CtaModule.Callout>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {
  args: {
    children: mockCtaSlots({
      ...CALLOUT_COPY,
      image: mockCtaImage('callout-default'),
    }),
  },
};

export const Centered: TStory = {
  args: {
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
    children: mockCtaSlots({
      ...CALLOUT_COPY,
      image: mockCtaImage('callout-centered'),
    }),
  },
};

export const NoImage: TStory = {
  args: {
    tone: BRAND_VARIANT.SECONDARY,
    heading: 'Getting started takes three steps',
    children: mockCtaSlots({
      content: (
        <ol>
          <li>Create your publication</li>
          <li>Import or write your first post</li>
          <li>Share the link — that&apos;s it</li>
        </ol>
      ),
      actions: MOCK_CTA_PRIMARY_AND_INLINE_LINK,
    }),
  },
};

export const TonePrimary: TStory = {
  args: {
    tone: BRAND_VARIANT.PRIMARY,
    children: mockCtaSlots({ ...CALLOUT_COPY, footnote: undefined }),
  },
};

export const ByCardStyle: TStory = {
  render: (args) => (
    <CardStyles>
      {(cardStyle) =>
        objectKeys(ctaModuleVariants.variants.tone).map((tone) => (
          <CtaModule.Callout
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
