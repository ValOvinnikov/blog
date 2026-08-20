import { BRAND_VARIANT } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { CtaModuleView } from './cta-module-view';

const meta = {
  title: 'Modules/CtaModule',
  component: CtaModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    id: 'cta-1',
    brandVariant: BRAND_VARIANT.PRIMARY,
    sectionHeader: {
      heading: 'Never miss a post',
      supportingText:
        'Subscribe to get new articles on design systems and engineering delivered straight to your inbox.',
      align: undefined,
    },
    action: {
      label: 'Subscribe now',
      href: '/blog',
      target: undefined,
      platform: undefined,
      ariaLabel: undefined,
    },
    layout: undefined,
  },
} satisfies Meta<typeof CtaModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

/**
 * The `action`'s `SmartLink` composition is dropped entirely, not stubbed —
 * `CtaModuleUi` renders no action slot at all.
 */
export const WithoutAction: TStory = {
  args: { action: undefined },
};

export const BrandSecondary: TStory = {
  args: { brandVariant: BRAND_VARIANT.SECONDARY },
};
