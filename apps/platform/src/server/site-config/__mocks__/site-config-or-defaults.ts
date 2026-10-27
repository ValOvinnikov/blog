import type { TSiteConfigThemeAndAssets } from '@platform/server/site-config/site-config-or-defaults';
import { mockSiteConfigThemeAndAssets } from '@platform/testing/site-config/fixtures';

export const getSiteConfigOrDefaults = vi.fn<
  (tenantId: string) => Promise<TSiteConfigThemeAndAssets>
>(async () => mockSiteConfigThemeAndAssets());
