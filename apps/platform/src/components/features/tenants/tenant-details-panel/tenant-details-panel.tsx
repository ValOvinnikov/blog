'use client';

import { ALERT_TYPE, LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_PLAN, type TTenantPlan } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { FormField } from '@platform/components/shared/form-field';
import { FormTextInput } from '@platform/components/shared/form-text-input';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { useToast } from '@platform/context/toast-provider';
import { useUnsavedChangesGuard } from '@platform/context/unsaved-changes-provider';
import {
  updateTenantDetailsAction,
  type TUpdateTenantDetailsActionInput,
  type TUpdateTenantDetailsFieldErrors,
} from '@platform/server/tenants/update-tenant-details-action';
import {
  ALL_FIELD_KEYS,
  type TTenantFieldKey,
  type TTenantFieldLockReason,
  type TTenantFieldLocks,
} from '@platform/utils/tenant-field-locks/tenant-field-locks';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useId, useState, useTransition } from 'react';

import { tenantDetailsPanelVariants } from './tenant-details-panel-variants';
import { useLockStateChange } from './use-lock-state-change';

export type TTenantDetailsPanelProps = {
  tenant: TTenant;
  fieldLocks: TTenantFieldLocks;
  ownerEmail: string | undefined;
  archivedNoticeId?: string;
};

type TFormValues = {
  name: string;
  primaryDomain: string;
  plan: TTenantPlan;
  locale: string;
  ownerEmail: string;
};

type TTextFieldKey = 'name' | 'primaryDomain' | 'ownerEmail';

const TEXT_FIELD_TYPE: Partial<Record<TTextFieldKey, string>> = {
  ownerEmail: 'email',
};

const valuesFromProps = (
  tenant: TTenant,
  ownerEmail: string | undefined,
): TFormValues => {
  return {
    name: tenant.name,
    primaryDomain: tenant.primaryDomain,
    plan: tenant.plan,
    locale: tenant.locale,
    ownerEmail: ownerEmail ?? '',
  };
};

// A plain `next[key] = baseline[key]` inside a loop over a union-typed key
// loses the correlation between the two sides (TS widens each indexed
// access independently) — a generic per-call keeps `K` fixed for both.
const resetFieldToBaseline = <K extends TTenantFieldKey>(
  target: TFormValues,
  baseline: TFormValues,
  key: K,
): void => {
  target[key] = baseline[key];
};

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
  const localeLockReasonId = useId();
  const planLockReasonId = useId();
  const [renderedTenant, setRenderedTenant] = useState(tenant);
  const [renderedOwnerEmail, setRenderedOwnerEmail] = useState(ownerEmail);
  const [values, setValues] = useState<TFormValues>(() =>
    valuesFromProps(tenant, ownerEmail),
  );
  const [fieldErrors, setFieldErrors] =
    useState<TUpdateTenantDetailsFieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();
  const isArchived = Boolean(tenant.deprovisionedAt);

  if (tenant !== renderedTenant || ownerEmail !== renderedOwnerEmail) {
    setRenderedTenant(tenant);
    setRenderedOwnerEmail(ownerEmail);
    setValues(valuesFromProps(tenant, ownerEmail));
  }

  const effectiveFieldLocks: TTenantFieldLocks = isArchived
    ? Object.fromEntries(
        ALL_FIELD_KEYS.map((key) => [key, { kind: 'archived' } as const]),
      )
    : fieldLocks;

  const { lockAnnouncement, fieldsContainerRef } = useLockStateChange({
    panelId,
    fieldLocks: effectiveFieldLocks,
    lockedAnnouncement: t('lockedAnnouncement'),
    unlockedAnnouncement: t('unlockedAnnouncement'),
    onFieldsLocked: (newlyLockedKeys) => {
      const baseline = valuesFromProps(tenant, ownerEmail);
      setValues((prev) => {
        const next = { ...prev };
        for (const key of newlyLockedKeys) {
          resetFieldToBaseline(next, baseline, key);
        }
        return next;
      });
    },
  });

  const {
    root,
    bodyStack,
    fields,
    lockAnnouncementLive,
    planControl,
    footerActions,
  } = tenantDetailsPanelVariants();

  const baselineValues = valuesFromProps(tenant, ownerEmail);
  const changeCount = ALL_FIELD_KEYS.filter(
    (key) => values[key] !== baselineValues[key],
  ).length;
  const isDirty = changeCount > 0;

  const updateField = <K extends keyof TFormValues>(
    key: K,
    nextValue: TFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: nextValue }));
  };

  const save = async (): Promise<boolean> => {
    setFormError(undefined);
    setFieldErrors({});

    const payload: TUpdateTenantDetailsActionInput = {
      name: values.name,
      primaryDomain: values.primaryDomain,
      plan: values.plan,
      locale: values.locale,
      ownerEmail: values.ownerEmail,
    };

    const result = await updateTenantDetailsAction(tenant.id, payload);
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

  const lockReasonText = (reason: TTenantFieldLockReason): string => {
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

  const textFields: { key: TTextFieldKey; label: string }[] = [
    { key: 'name', label: t('nameLabel') },
    { key: 'primaryDomain', label: t('domainLabel') },
    { key: 'ownerEmail', label: t('ownerEmailLabel') },
  ];

  const localeOptions = Object.values(LOCALE_ISO_CODES).map((locale) => ({
    value: locale,
    label: tLanguage(locale),
  }));

  const planLock = effectiveFieldLocks.plan;
  const localeLock = effectiveFieldLocks.locale;

  return (
    <div className={root()} data-tenant-details-panel={panelId}>
      {formError && <Alert type={ALERT_TYPE.ERROR} title={formError} />}

      <Card>
        <Card.Header title={t('heading')} headingLevel={2} />
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
              {textFields.map(({ key, label: labelText }) => {
                const errorMessage = fieldErrors[key];
                const lock = effectiveFieldLocks[key];

                return (
                  <FormTextInput
                    key={key}
                    label={labelText}
                    hint={lock && lockReasonText(lock)}
                    error={errorMessage}
                    type={TEXT_FIELD_TYPE[key]}
                    value={values[key]}
                    onChange={(nextValue) => updateField(key, nextValue)}
                    isDisabled={Boolean(lock)}
                  />
                );
              })}

              <FormField
                label={t('localeLabel')}
                hasOwnAccessibleName={true}
                hint={
                  localeLock && (
                    <span id={localeLockReasonId}>
                      {lockReasonText(localeLock)}
                    </span>
                  )
                }
              >
                <SegmentedControl<string>
                  ariaLabel={t('localeLabel')}
                  options={localeOptions}
                  value={values.locale}
                  onChange={(locale) => updateField('locale', locale)}
                  className={planControl()}
                  isDisabled={Boolean(localeLock)}
                  aria-describedby={localeLock ? localeLockReasonId : undefined}
                />
              </FormField>

              <FormField
                label={t('planLabel')}
                hasOwnAccessibleName={true}
                hint={
                  planLock && (
                    <span id={planLockReasonId}>
                      {lockReasonText(planLock)}
                    </span>
                  )
                }
              >
                <SegmentedControl<TTenantPlan>
                  ariaLabel={t('planLabel')}
                  options={planOptions}
                  value={values.plan}
                  onChange={(plan) => updateField('plan', plan)}
                  className={planControl()}
                  isDisabled={Boolean(planLock)}
                  aria-describedby={planLock ? planLockReasonId : undefined}
                />
              </FormField>
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
