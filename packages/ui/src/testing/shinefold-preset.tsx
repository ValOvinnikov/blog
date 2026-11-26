import { PRESET_ID } from '@shinefold/config';
import { formatPresetSurfaceBlock } from '@shinefold/config/theme';
import type { Decorator } from '@storybook/react-vite';

import { ColorSchemeFrames, IN_OWN_IFRAME } from './color-scheme-frames';

const SHINEFOLD_PRESET_CSS = formatPresetSurfaceBlock(PRESET_ID.SHINEFOLD);

// The light frame reads the preset's :root values, so it shows light only while the toolbar theme is light.
const withShinefoldPreset: Decorator = (Story) => (
  <ColorSchemeFrames css={SHINEFOLD_PRESET_CSS}>
    <div className="bg-ambient p-6 text-text">
      <Story />
    </div>
  </ColorSchemeFrames>
);

export const SHINEFOLD_PRESET_STORY = {
  decorators: [withShinefoldPreset],
  parameters: IN_OWN_IFRAME,
};
