import 'server-only';

import {
  hasGoogleAnalyticsId,
  toAnalyticsDraft,
} from '@platform/utils/analytics-draft/analytics-draft';
import { queries } from '@shinefold/db';

export const requiresConsentBanner = async (
  tenantId: string,
  hasOwnAnalytics: boolean,
): Promise<boolean> =>
  hasOwnAnalytics &&
  hasGoogleAnalyticsId(
    toAnalyticsDraft(
      await queries.tenantAnalytics.getStoredTenantAnalytics(tenantId),
    ),
  );
