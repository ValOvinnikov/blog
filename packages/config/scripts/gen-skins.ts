import { writeFileSync } from 'node:fs';

import {
  formatSkinCss,
  formatStorybookSkinCss,
  SKIN_CSS_REPO_PATH,
  STORYBOOK_SKIN_CSS_REPO_PATH,
} from '@shinefold/config/theme/skin-css';

const writeRepoFile = (path: string, content: string): void =>
  writeFileSync(new URL(`../../../${path}`, import.meta.url), content);

writeRepoFile(SKIN_CSS_REPO_PATH, formatSkinCss());
writeRepoFile(STORYBOOK_SKIN_CSS_REPO_PATH, formatStorybookSkinCss());
