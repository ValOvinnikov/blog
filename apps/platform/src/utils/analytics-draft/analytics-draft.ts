import { blankToNull } from '@platform/utils/blank-to-null/blank-to-null';
import type { TSettingsFeaturesValues } from '@platform/utils/settings-features-fields/settings-features-fields';
import type { TMaybeUndefined } from '@shinefold/config';
import {
  ANALYTICS_PROVIDER,
  type TAnalyticsProvider,
} from '@shinefold/config/constants';
import type { TTenantAnalytics } from '@shinefold/db/queries/tenant-analytics';
import { isNull } from '@shinefold/utils/primitives';

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

export const hasGoogleAnalyticsId = ({
  analyticsProvider,
  analyticsId,
}: TAnalyticsDraft): boolean =>
  analyticsProvider === ANALYTICS_PROVIDER.GOOGLE_ANALYTICS &&
  !isNull(blankToNull(analyticsId));

/** Google Analytics loads only after a visitor allows it in the consent banner, so its id keeps the banner on. */
export const withConsentBannerForGoogleAnalytics = (
  values: TFeaturesFormValues,
): TFeaturesFormValues =>
  hasGoogleAnalyticsId(values)
    ? { ...values, consentBannerEnabled: true }
    : values;
