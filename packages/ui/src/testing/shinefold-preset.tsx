import { COLOR_SCHEME, PRESET_ID } from '@shinefold/config';
import { formatPresetSurfaceBlock } from '@shinefold/config/theme';
import type { Decorator } from '@storybook/react-vite';

const SHINEFOLD_PRESET_CSS = formatPresetSurfaceBlock(PRESET_ID.SHINEFOLD);

// The light frame reads the preset's :root values, so it shows light only while the toolbar theme is light.
export const withShinefoldPreset: Decorator = (Story) => (
  <div className="flex flex-col gap-6">
    <style>{SHINEFOLD_PRESET_CSS}</style>
    {Object.values(COLOR_SCHEME).map((scheme) => (
      <div
        key={scheme}
        className={scheme === COLOR_SCHEME.DARK ? 'dark' : undefined}
      >
        <div className="bg-ambient p-6 text-text">
          <Story />
        </div>
      </div>
    ))}
  </div>
);
