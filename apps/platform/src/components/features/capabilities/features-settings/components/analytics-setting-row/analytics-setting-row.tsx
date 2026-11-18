import { FormField } from '@platform/components/shared/form-field';
import { LockedReason } from '@platform/components/shared/locked-reason';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { SettingRow } from '@platform/components/shared/setting-row';
import { TextInput } from '@platform/components/shared/text-input';
import { useSettingsFormState } from '@platform/context/settings-form-provider';
import type { TAnalyticsDraft } from '@platform/utils/analytics-draft/analytics-draft';
import { CAPABILITY } from '@shinefold/config';
import {
  ANALYTICS_PROVIDER,
  TENANT_PLAN,
  type TAnalyticsProvider,
} from '@shinefold/config/constants';
import { PLAN_ENTITLEMENTS } from '@shinefold/db/constants';
import { useTranslations } from 'next-intl';

import { analyticsSettingRowVariants } from './analytics-setting-row-variants';

const ANALYTICS_PLAN =
  Object.values(TENANT_PLAN).find(
    (plan) => PLAN_ENTITLEMENTS[plan].hasOwnAnalytics,
  ) ?? TENANT_PLAN.GROWTH;

export type TAnalyticsSettingRowProps = {
  draft: TAnalyticsDraft;
  hasOwnAnalytics: boolean;
  idFieldId: string;
  isIdInvalid: boolean;
  onChange: (draft: TAnalyticsDraft) => void;
};

export const AnalyticsSettingRow = ({
  draft,
  hasOwnAnalytics,
  idFieldId,
  isIdInvalid,
  onChange,
}: TAnalyticsSettingRowProps) => {
  const t = useTranslations('featuresSettings');
  const { isArchived, isPending, archivedDescribedBy } = useSettingsFormState();
  const { analyticsProvider, analyticsId } = draft;
  const { root, row } = analyticsSettingRowVariants();

  return (
    <div className={root()}>
      <SettingRow
        label={t(`toggleLabel.${CAPABILITY.ANALYTICS}`)}
        description={t(`toggleDescription.${CAPABILITY.ANALYTICS}`)}
        status={
          !hasOwnAnalytics && (
            <LockedReason>
              {t('planLockedBadge', { plan: ANALYTICS_PLAN })}
            </LockedReason>
          )
        }
        className={row()}
      >
        <SegmentedControl<TAnalyticsProvider>
          aria={{
            label: t('analyticsProviderLabel'),
            describedBy: archivedDescribedBy,
          }}
          options={Object.values(ANALYTICS_PROVIDER).map((provider) => ({
            value: provider,
            label: t(`analyticsProviderOption.${provider}`),
          }))}
          value={analyticsProvider}
          onChange={(provider) =>
            onChange({ ...draft, analyticsProvider: provider })
          }
          lock={{
            isLocked: !hasOwnAnalytics && !isArchived,
            isDisabled: isArchived || isPending,
          }}
        />
      </SettingRow>
      <FormField
        label={t(`analyticsIdLabel.${analyticsProvider}`)}
        hint={t(`analyticsIdHint.${analyticsProvider}`)}
        error={
          isIdInvalid ? t(`analyticsIdInvalid.${analyticsProvider}`) : undefined
        }
        control={{
          id: idFieldId,
          isDisabled: isArchived || isPending,
          describedBy: archivedDescribedBy,
        }}
      >
        <TextInput
          value={analyticsId}
          placeholder={t(`analyticsIdPlaceholder.${analyticsProvider}`)}
          isReadOnly={!hasOwnAnalytics}
          onChange={(id) => onChange({ ...draft, analyticsId: id })}
        />
      </FormField>
    </div>
  );
};
