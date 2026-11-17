import { readRepoFile } from '@shinefold/config/testing/theme-css';

import {
  formatSkinCss,
  formatStorybookSkinCss,
  SKIN_CSS_REPO_PATH,
  STORYBOOK_SKIN_CSS_REPO_PATH,
} from './skin-css';

describe('the generated skin stylesheets', () => {
  it.each([
    [SKIN_CSS_REPO_PATH, formatSkinCss],
    [STORYBOOK_SKIN_CSS_REPO_PATH, formatStorybookSkinCss],
  ])(
    '%s matches its formatter, so run gen:skins after a skin change',
    (path, format) => {
      expect(readRepoFile(path)).toBe(format());
    },
  );

  it('keeps the Storybook-only skins out of the site stylesheet', () => {
    expect(formatSkinCss()).not.toContain('STORYBOOK');
  });
});
