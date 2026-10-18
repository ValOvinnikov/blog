'use client';

import {
  ALERT_TYPE,
  LOCALE_ISO_CODES,
  type TMaybeUndefined,
} from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import type { TTenantOwnerMembership } from '@blog/db/queries/memberships';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { FormField } from '@platform/components/shared/form-field';
import { TextInput } from '@platform/components/shared/text-input';
import { useUnsavedChangesGuard } from '@platform/context/unsaved-changes-provider';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import {
  ALL_FIELD_KEYS,
  lockAllFields,
  type TTenantFieldLockReason,
  type TTenantFieldLocks,
} from '@platform/utils/tenant-field-locks/tenant-field-locks';
import { useTenantFieldErrorText } from '@platform/utils/use-tenant-field-error-text/use-tenant-field-error-text';
import { useTranslations } from 'next-intl';
import { useId, useState, useTransition } from 'react';

import { LockableSegmentedField } from './components/lockable-segmented-field/lockable-segmented-field';
import { tenantDetailsPanelVariants } from './tenant-details-panel-variants';
import {
  tenantDetailsValuesOf,
  type TTenantDetailsValues,
} from './tenant-details-values';
import { useLockStateChange } from './use-lock-state-change';
import { useTenantDetailsSave } from './use-tenant-details-save';

export type TTenantDetailsPanelProps = {
  tenant: TClientTenant;
  fieldLocks: TTenantFieldLocks;
  owner: TMaybeUndefined<TTenantOwnerMembership>;
  archivedNoticeId?: string;
};

const TEXT_FIELDS = [
  { key: 'name', labelKey: 'nameLabel' },
  { key: 'primaryDomain', labelKey: 'domainLabel' },
  { key: 'ownerEmail', labelKey: 'ownerEmailLabel', type: 'email' },
] as const;

export const TenantDetailsPanel = ({
  tenant,
  fieldLocks,
  owner,
  archivedNoticeId,
}: TTenantDetailsPanelProps) => {
  const ownerEmail = owner?.email;
  const t = useTranslations('tenantDetailsPanel');
  const tSteps = useTranslations('provisioningStatusView');
  const tLanguage = useTranslations('languageNames');
  const fieldErrorText = useTenantFieldErrorText();
  const panelId = useId();
  const baselineValues = tenantDetailsValuesOf(tenant, ownerEmail);
  const [renderedTenant, setRenderedTenant] = useState(tenant);
  const [renderedOwnerEmail, setRenderedOwnerEmail] = useState(ownerEmail);
  const [values, setValues] = useState<TTenantDetailsValues>(baselineValues);
  const { fieldErrors, formError, save, clearErrors } = useTenantDetailsSave(
    tenant.id,
    values,
  );
  const [isPending, startTransition] = useTransition();
  const isArchived = Boolean(tenant.deprovisionedAt);

  if (tenant !== renderedTenant || ownerEmail !== renderedOwnerEmail) {
    setRenderedTenant(tenant);
    setRenderedOwnerEmail(ownerEmail);
    setValues(baselineValues);
  }

  const effectiveFieldLocks = isArchived
    ? lockAllFields({ kind: 'archived' })
    : fieldLocks;

  const { lockAnnouncement, fieldsContainerRef } = useLockStateChange({
    panelId,
    fieldLocks: effectiveFieldLocks,
    lockedAnnouncement: t('lockedAnnouncement'),
    unlockedAnnouncement: t('unlockedAnnouncement'),
    onFieldsLocked: (newlyLockedKeys) => {
      setValues((prev) => ({
        ...prev,
        ...Object.fromEntries(
          newlyLockedKeys.map((key) => [key, baselineValues[key]]),
        ),
      }));
    },
  });

  const {
    root,
    bodyStack,
    fields,
    lockAnnouncementLive,
    wideField,
    footerActions,
  } = tenantDetailsPanelVariants();

  const changeCount = ALL_FIELD_KEYS.filter(
    (key) => values[key] !== baselineValues[key],
  ).length;
  const isDirty = changeCount > 0;

  const updateField = <K extends keyof TTenantDetailsValues>(
    key: K,
    nextValue: TTenantDetailsValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: nextValue }));
  };

  const handleSave = () => {
    startTransition(async () => {
      await save();
    });
  };

  const discard = () => {
    setValues(baselineValues);
    clearErrors();
  };

  useUnsavedChangesGuard(
    isDirty ? { pageTitle: t('heading'), changeCount, save, discard } : null,
  );

  const lockReasonText = (
    reason: TMaybeUndefined<TTenantFieldLockReason>,
  ): TMaybeUndefined<string> => {
    if (!reason) {
      return undefined;
    }
    switch (reason.kind) {
      case 'step':
        return t('fieldLockedReasonStep', {
          step: tSteps(`stepLabel.${reason.step}`),
        });
      case 'succeeded':
        return t('fieldLockedReasonSucceeded');
      case 'archived':
        return t('fieldLockedReasonArchived');
      case 'running':
        return t('fieldLockedReasonRunning');
      default: {
        const unhandledReason: never = reason;
        throw new Error(
          `lockReasonText: unhandled reason ${JSON.stringify(unhandledReason)}`,
        );
      }
    }
  };

  const planOptions = [
    { value: TENANT_PLAN.FREE, label: t('planOptionFree') },
    { value: TENANT_PLAN.GROWTH, label: t('planOptionGrowth') },
  ];

  const localeOptions = Object.values(LOCALE_ISO_CODES).map((locale) => ({
    value: locale,
    label: tLanguage(locale),
  }));

  return (
    <div className={root()} data-tenant-details-panel={panelId}>
      {formError && (
        <Alert type={ALERT_TYPE.ERROR} title={t(`errors.${formError}`)} />
      )}

      <Card>
        <Card.Header title={t('heading')} />
        <Card.Body>
          <div className={bodyStack()}>
            <span
              className={lockAnnouncementLive()}
              aria-live="assertive"
              data-testid="lock-announcement-live"
            >
              {lockAnnouncement}
            </span>

            <div
              className={fields()}
              ref={fieldsContainerRef}
              tabIndex={-1}
              role="group"
              aria-label={t('fieldsGroupLabel')}
            >
              {TEXT_FIELDS.map((field) => {
                const { key, labelKey } = field;
                const lockReason = lockReasonText(effectiveFieldLocks[key]);

                return (
                  <FormField
                    key={key}
                    label={t(labelKey)}
                    hint={lockReason}
                    error={fieldErrorText(fieldErrors[key])}
                    control={{ isDisabled: Boolean(lockReason) }}
                  >
                    <TextInput
                      type={'type' in field ? field.type : undefined}
                      value={values[key]}
                      onChange={(nextValue) => updateField(key, nextValue)}
                    />
                  </FormField>
                );
              })}

              <div className={wideField()}>
                <LockableSegmentedField
                  label={t('localeLabel')}
                  options={localeOptions}
                  value={values.locale}
                  onChange={(locale) => updateField('locale', locale)}
                  lockReason={lockReasonText(effectiveFieldLocks.locale)}
                />
              </div>

              <LockableSegmentedField
                label={t('planLabel')}
                options={planOptions}
                value={values.plan}
                onChange={(plan) => updateField('plan', plan)}
                lockReason={lockReasonText(effectiveFieldLocks.plan)}
              />
            </div>
          </div>
        </Card.Body>

        <Card.Footer>
          <div className={footerActions()}>
            <Button
              type="button"
              variant="primary"
              onClick={handleSave}
              isDisabled={!isDirty || isArchived}
              isPending={isPending}
              pendingLabel={t('savingButton')}
              aria-describedby={isArchived ? archivedNoticeId : undefined}
            >
              {t('saveButton')}
            </Button>
          </div>
        </Card.Footer>
      </Card>
    </div>
  );
};
