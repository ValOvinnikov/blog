import type { TSettingsFeaturesValues } from '@platform/utils/settings-features-fields/settings-features-fields';
import type { TMaybeUndefined } from '@shinefold/config';
import {
  ANALYTICS_PROVIDER,
  type TAnalyticsProvider,
} from '@shinefold/config/constants';
import type { TTenantAnalytics } from '@shinefold/db/queries/tenant-analytics';

export type TAnalyticsDraft = {
  analyticsProvider: TAnalyticsProvider;
  analyticsId: string;
};

export type TFeaturesFormValues = TSettingsFeaturesValues & TAnalyticsDraft;

const ANALYTICS_DRAFT_FIELDS = [
  'analyticsProvider',
  'analyticsId',
] as const satisfies (keyof TAnalyticsDraft)[];

export const toAnalyticsDraft = (
  stored: TMaybeUndefined<TTenantAnalytics>,
): TAnalyticsDraft => ({
  analyticsProvider: stored?.provider ?? ANALYTICS_PROVIDER.GOOGLE_ANALYTICS,
  analyticsId: stored?.analyticsId ?? '',
});

export const countAnalyticsChanges = (
  values: TAnalyticsDraft,
  savedValues: TAnalyticsDraft,
): number =>
  ANALYTICS_DRAFT_FIELDS.filter((field) => values[field] !== savedValues[field])
    .length;

export const splitFeaturesFormValues = ({
  analyticsProvider,
  analyticsId,
  ...features
}: TFeaturesFormValues): {
  features: TSettingsFeaturesValues;
  analytics: TAnalyticsDraft;
} => ({ features, analytics: { analyticsProvider, analyticsId } });
