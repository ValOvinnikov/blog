import { readRepoFile } from '@shinefold/config/testing/theme-css';

import { formatSkinCss, SKIN_CSS_REPO_PATH } from './skin-css';

describe(formatSkinCss, () => {
  it('matches the checked-in stylesheet, so run gen:skins after a palette change', () => {
    expect(readRepoFile(SKIN_CSS_REPO_PATH)).toBe(formatSkinCss());
  });
});
