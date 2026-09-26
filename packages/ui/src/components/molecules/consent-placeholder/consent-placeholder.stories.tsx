import { mediaFrameVariants } from '@blog/ui/components/atoms/media-frame/media-frame-variants';
import { objectKeys } from '@blog/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ConsentPlaceholder } from './consent-placeholder';

const meta = {
  title: 'Molecules/ConsentPlaceholder',
  component: ConsentPlaceholder,
  tags: ['autodocs'],
  args: {
    providerName: 'YouTube',
    message: 'This embed is blocked until you allow YouTube content.',
    allowLabel: 'Allow YouTube',
    ratio: 'video',
    onAllow: () => {},
    className: 'w-96',
  },
  argTypes: {
    ratio: {
      control: 'select',
      options: objectKeys(mediaFrameVariants.variants.ratio),
    },
  },
} satisfies Meta<typeof ConsentPlaceholder>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const Square: TStory = {
  args: {
    providerName: 'Google Maps',
    message: 'This map is blocked until you allow Google Maps content.',
    allowLabel: 'Allow Google Maps',
    ratio: 'square',
  },
};
