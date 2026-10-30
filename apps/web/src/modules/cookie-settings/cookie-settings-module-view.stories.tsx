import { BRAND_VARIANT } from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { CookieSettingsModuleView } from './cookie-settings-module-view';

const meta = {
  title: 'Modules/CookieSettingsModule',
  component: CookieSettingsModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    brandVariant: {
      control: 'select',
      options: Object.values(BRAND_VARIANT),
    },
  },
  args: {
    id: 'cookie-settings-1',
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockHeadingBlock({ heading: 'Cookie settings' }),
    layout: undefined,
  },
} satisfies Meta<typeof CookieSettingsModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithSupportingText: TStory = {
  args: {
    headingBlock: mockHeadingBlock({
      heading: 'Your cookie choices',
      supportingText: 'Change what this site may store at any time.',
    }),
  },
};

export const Secondary: TStory = {
  args: { brandVariant: BRAND_VARIANT.SECONDARY },
};
