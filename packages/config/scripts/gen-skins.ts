import { writeFileSync } from 'node:fs';

import {
  formatSkinCss,
  SKIN_CSS_REPO_PATH,
} from '@shinefold/config/theme/skin-css';

writeFileSync(
  new URL(`../../../${SKIN_CSS_REPO_PATH}`, import.meta.url),
  formatSkinCss(),
);
