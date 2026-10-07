import type * as TModule from '@web/server/site-settings/get-site-settings/get-site-settings';
import { DEFAULT_SITE_SETTINGS } from '@web/testing/shared/site-settings/fixtures';

export const getSiteSettings = vi.fn<typeof TModule.getSiteSettings>(
  async () => ({ ok: true, data: DEFAULT_SITE_SETTINGS }),
);
