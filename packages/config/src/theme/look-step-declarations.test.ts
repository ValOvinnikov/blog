import { readThemeDeclarations } from '@shinefold/config/testing/theme-css';

import { PRESET_ID, PRESET_REGISTRY } from '@shinefold/config/constants';

import { DIVIDER_WIDTH_DECLARATIONS } from './divider-declarations';
import {
  HEADING_CASE_DECLARATIONS,
  HEADING_WEIGHT_DECLARATIONS,
} from './heading-declarations';
import { IMAGE_PROPORTION_DECLARATIONS } from './image-proportion-declarations';

const presetDefaults = Object.values(PRESET_ID).flatMap((preset) => {
  const { headingWeight, headingCase, imageProportion, dividerWidth } =
    PRESET_REGISTRY[preset];

  return [
    {
      label: `${preset} heading weight`,
      declarations: HEADING_WEIGHT_DECLARATIONS[headingWeight],
    },
    {
      label: `${preset} heading case`,
      declarations: HEADING_CASE_DECLARATIONS[headingCase],
    },
    {
      label: `${preset} image proportion`,
      declarations: IMAGE_PROPORTION_DECLARATIONS[imageProportion],
    },
    {
      label: `${preset} divider width`,
      declarations: DIVIDER_WIDTH_DECLARATIONS[dividerWidth],
    },
  ];
});

describe('Look step declarations', () => {
  it.each(presetDefaults)(
    "the $label default declares theme.css's own values",
    ({ declarations }) => {
      expect(readThemeDeclarations(declarations)).toEqual(declarations);
    },
  );
});
