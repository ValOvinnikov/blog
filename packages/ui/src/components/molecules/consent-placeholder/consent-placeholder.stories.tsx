import { mediaFrameVariants } from '@blog/ui/components/atoms/media-frame/media-frame-variants';
import { objectKeys } from '@blog/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { ConsentPlaceholder } from './consent-placeholder';

const meta = {
  title: 'Molecules/ConsentPlaceholder',
  component: ConsentPlaceholder,
  tags: ['autodocs'],
  args: {
    id: 'consent-placeholder-youtube',
    providerName: 'YouTube',
    message: 'This embed is blocked until you allow YouTube content.',
    allowLabel: 'Allow YouTube',
    settingsLabel: 'Cookie settings',
    scopeNote: 'Applies to every video, map and booking widget on this site.',
    ratio: 'video',
    onAllow: () => {},
    onOpenSettings: () => {},
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
    id: 'consent-placeholder-maps',
    providerName: 'Google Maps',
    message: 'This map is blocked until you allow Google Maps content.',
    allowLabel: 'Allow Google Maps',
    ratio: 'square',
  },
};

export const LongScopeNote: TStory = {
  args: {
    id: 'consent-placeholder-long-scope',
    providerName: 'Vimeo',
    message: 'This embed is blocked until you allow Vimeo content.',
    allowLabel: 'Allow Vimeo',
    ratio: 'square',
    scopeNote:
      'Applies to every video, map, booking widget, live chat and social feed embedded anywhere on this site, including pages you have not visited yet.',
  },
};
