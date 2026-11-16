import { readThemeDeclarations } from '@shinefold/config/testing/theme-css';

import {
  DERIVED_RADIUS_DECLARATIONS,
  DERIVED_SPACING_DECLARATIONS,
} from './theme-declarations';

describe('derived theme declarations', () => {
  it('match the radius aliases theme.css derives in @theme', () => {
    expect(readThemeDeclarations(DERIVED_RADIUS_DECLARATIONS)).toEqual(
      DERIVED_RADIUS_DECLARATIONS,
    );
  });

  it('match the band spacing steps theme.css derives in @theme', () => {
    expect(readThemeDeclarations(DERIVED_SPACING_DECLARATIONS)).toEqual(
      DERIVED_SPACING_DECLARATIONS,
    );
  });
});
