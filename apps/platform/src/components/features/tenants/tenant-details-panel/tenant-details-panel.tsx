'use client';

import {
  ALERT_TYPE,
  LOCALE_ISO_CODES,
  type TMaybeUndefined,
} from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { FormField } from '@platform/components/shared/form-field';
import { TextInput } from '@platform/components/shared/text-input';
import { useToast } from '@platform/context/toast-provider';
import { useUnsavedChangesGuard } from '@platform/context/unsaved-changes-provider';
import type { TClientTenant } from '@platform/server/tenants/to-client-tenant';
import {
  updateTenantDetailsAction,
  type TUpdateTenantDetailsFieldErrors,
} from '@platform/server/tenants/update-tenant-details-action';
import {
  ALL_FIELD_KEYS,
  lockAllFields,
  type TTenantFieldLockReason,
  type TTenantFieldLocks,
} from '@platform/utils/tenant-field-locks/tenant-field-locks';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useId, useState, useTransition } from 'react';

import { LockableSegmentedField } from './components/lockable-segmented-field/lockable-segmented-field';
import { tenantDetailsPanelVariants } from './tenant-details-panel-variants';
import {
  tenantDetailsValuesOf,
  type TTenantDetailsValues,
} from './tenant-details-values';
import { useLockStateChange } from './use-lock-state-change';

export type TTenantDetailsPanelProps = {
  tenant: TClientTenant;
  fieldLocks: TTenantFieldLocks;
  ownerEmail: TMaybeUndefined<string>;
  archivedNoticeId?: string;
};

const TEXT_FIELDS = [
  { key: 'name', labelKey: 'nameLabel' },
  { key: 'primaryDomain', labelKey: 'domainLabel' },
  { key: 'ownerEmail', labelKey: 'ownerEmailLabel', type: 'email' },
] as const;

/**
 * Renders every field as a control at all times, disabling only the ones a
 * completed provisioning step has already baked into an external resource —
 * so a field that caused a provisioning failure stays correctable instead of
 * the whole panel locking as a unit.
 */
export const TenantDetailsPanel = ({
  tenant,
  fieldLocks,
  ownerEmail,
  archivedNoticeId,
}: TTenantDetailsPanelProps) => {
  const t = useTranslations('tenantDetailsPanel');
  const tSteps = useTranslations('provisioningStatusView');
  const tLanguage = useTranslations('languageNames');
  const toast = useToast();
  const router = useRouter();
  const panelId = useId();
  const baselineValues = tenantDetailsValuesOf(tenant, ownerEmail);
  const [renderedTenant, setRenderedTenant] = useState(tenant);
  const [renderedOwnerEmail, setRenderedOwnerEmail] = useState(ownerEmail);
  const [values, setValues] = useState<TTenantDetailsValues>(baselineValues);
  const [fieldErrors, setFieldErrors] =
    useState<TUpdateTenantDetailsFieldErrors>({});
  const [formError, setFormError] =
    useState<TMaybeUndefined<string>>(undefined);
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

  const save = async (): Promise<boolean> => {
    setFormError(undefined);
    setFieldErrors({});

    const result = await updateTenantDetailsAction(tenant.id, values);
    if (!result.ok) {
      setFieldErrors(result.fieldErrors ?? {});
      setFormError(result.error);
      return false;
    }
    toast.success({
      message: t('alertSuccess'),
    });
    router.refresh();
    return true;
  };

  const handleSave = () => {
    startTransition(async () => {
      await save();
    });
  };

  const discard = () => {
    setValues(baselineValues);
    setFieldErrors({});
    setFormError(undefined);
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
      {formError && <Alert type={ALERT_TYPE.ERROR} title={formError} />}

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
                    error={fieldErrors[key]}
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
