import type { TBarBackgrounds } from '@web/server/site-config/get-bar-backgrounds/get-bar-backgrounds';
import { MOCK_BAR_BACKGROUNDS } from '@web/testing/shared/bar-backgrounds/fixtures';

export const getBarBackgrounds = async (): Promise<TBarBackgrounds> =>
  MOCK_BAR_BACKGROUNDS;
