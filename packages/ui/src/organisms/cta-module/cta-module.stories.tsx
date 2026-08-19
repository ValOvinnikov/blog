import { HEADING_ALIGN } from '@blog/config';
import { objectKeys } from '@blog/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { CtaModule } from './cta-module';
import { ctaModuleVariants } from './cta-module-variants';

const meta = {
  title: 'Organisms/CtaModule',
  component: CtaModule,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    align: {
      control: 'select',
      options: objectKeys(ctaModuleVariants.variants.align),
    },
  },
  args: {
    heading: 'Never miss a post',
    headingId: 'cta-module-heading',
    supportingText:
      'Subscribe to get new articles on design systems and engineering delivered straight to your inbox.',
    action: <a href="/subscribe">Subscribe now</a>,
  },
} satisfies Meta<typeof CtaModule>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithoutHeading: TStory = {
  args: {
    heading: undefined,
    headingId: undefined,
  },
};

export const WithoutSupportingText: TStory = {
  args: {
    supportingText: undefined,
  },
};

export const WithoutAction: TStory = {
  args: {
    action: undefined,
  },
};

export const Centered: TStory = {
  args: {
    align: HEADING_ALIGN.CENTER,
  },
};

export const Wrapped: TStory = {
  args: {
    isWrapped: true,
  },
};
