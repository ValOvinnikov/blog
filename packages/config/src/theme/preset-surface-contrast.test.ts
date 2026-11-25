import { PRESET_ID } from '@shinefold/config/constants';

import { findPresetSurfaceFailures } from './preset-surface-contrast';

describe(findPresetSurfaceFailures, () => {
  it.each(Object.values(PRESET_ID))(
    'finds no failure beyond the known ones for %s in light or dark',
    (preset) => {
      expect(findPresetSurfaceFailures(preset)).toEqual([]);
    },
  );
});
