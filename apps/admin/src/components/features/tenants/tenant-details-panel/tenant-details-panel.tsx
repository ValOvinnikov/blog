'use client';

import { Alert } from '@admin/components/shared/alert';
import { Button } from '@admin/components/shared/button';
import { Card } from '@admin/components/shared/card';
import { FormField } from '@admin/components/shared/form-field';
import { FormTextInput } from '@admin/components/shared/form-text-input';
import { SegmentedControl } from '@admin/components/shared/segmented-control';
import { useToast } from '@admin/context/toast-provider';
import {
  updateTenantDetailsAction,
  type TUpdateTenantDetailsActionInput,
  type TUpdateTenantDetailsFieldErrors,
} from '@admin/server/tenants/update-tenant-details-action';
import type {
  TTenantFieldKey,
  TTenantFieldLockReason,
  TTenantFieldLocks,
} from '@admin/utils/tenant-field-locks/tenant-field-locks';
import { ALERT_TYPE } from '@blog/config';
import { TENANT_PLAN, type TTenantPlan } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useId, useState, useTransition } from 'react';

import { tenantDetailsPanelVariants } from './tenant-details-panel-variants';
import { useLockStateChange } from './use-lock-state-change';

export type TTenantDetailsPanelProps = {
  tenant: TTenant;
  fieldLocks: TTenantFieldLocks;
  ownerEmail: string | undefined;
};

type TFormValues = {
  name: string;
  slug: string;
  primaryDomain: string;
  plan: TTenantPlan;
  locale: string;
  ownerEmail: string;
};

type TTextFieldKey =
  'name' | 'slug' | 'primaryDomain' | 'locale' | 'ownerEmail';

const TEXT_FIELD_ID: Record<TTextFieldKey, string> = {
  name: 'tenant-detail-name',
  slug: 'tenant-detail-slug',
  primaryDomain: 'tenant-detail-domain',
  locale: 'tenant-detail-locale',
  ownerEmail: 'tenant-detail-owner-email',
};

const TEXT_FIELD_TYPE: Partial<Record<TTextFieldKey, string>> = {
  ownerEmail: 'email',
};

const PLAN_FIELD_ID = 'tenant-detail-plan';

const valuesFromProps = (
  tenant: TTenant,
  ownerEmail: string | undefined,
): TFormValues => {
  return {
    name: tenant.name,
    slug: tenant.slug,
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
}: TTenantDetailsPanelProps) => {
  const t = useTranslations('tenantDetailsPanel');
  const tSteps = useTranslations('provisioningStatusView');
  const toast = useToast();
  const router = useRouter();
  const panelId = useId();
  const [renderedTenant, setRenderedTenant] = useState(tenant);
  const [renderedOwnerEmail, setRenderedOwnerEmail] = useState(ownerEmail);
  const [values, setValues] = useState<TFormValues>(() =>
    valuesFromProps(tenant, ownerEmail),
  );
  const [fieldErrors, setFieldErrors] =
    useState<TUpdateTenantDetailsFieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  // A fresh `tenant`/`ownerEmail` prop (a successful save's own
  // `router.refresh()`) should replace whatever the form last held —
  // adjusted during render, per React's guidance for state derived from
  // props.
  if (tenant !== renderedTenant || ownerEmail !== renderedOwnerEmail) {
    setRenderedTenant(tenant);
    setRenderedOwnerEmail(ownerEmail);
    setValues(valuesFromProps(tenant, ownerEmail));
  }

  const { lockAnnouncement, fieldsContainerRef } = useLockStateChange({
    panelId,
    fieldLocks,
    lockedAnnouncement: t('lockedAnnouncement'),
    unlockedAnnouncement: t('unlockedAnnouncement'),
    // A field that just locked (e.g. a background poll catching up to a
    // step another operator retried) may still hold an unsaved edit —
    // discard it back to the server value rather than leave a disabled
    // control displaying input that was never saved and can no longer be
    // submitted.
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
    bodyStack,
    fields,
    fieldLockReason,
    lockAnnouncementLive,
    planControl,
  } = tenantDetailsPanelVariants();

  // `tenant`/`ownerEmail` are the baseline: whenever a fresh pair of props
  // lands, the render-phase adjustment above resets `values` to match in the
  // same pass, so the two stay in lockstep without any extra state to track
  // a "saved" copy.
  const baselineValues = valuesFromProps(tenant, ownerEmail);
  const isDirty =
    values.name !== baselineValues.name ||
    values.slug !== baselineValues.slug ||
    values.primaryDomain !== baselineValues.primaryDomain ||
    values.plan !== baselineValues.plan ||
    values.locale !== baselineValues.locale ||
    values.ownerEmail !== baselineValues.ownerEmail;

  const updateField = <K extends keyof TFormValues>(
    key: K,
    nextValue: TFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: nextValue }));
  };

  const handleSave = () => {
    setFormError(undefined);
    setFieldErrors({});

    const payload: TUpdateTenantDetailsActionInput = {
      name: values.name,
      slug: values.slug,
      primaryDomain: values.primaryDomain,
      plan: values.plan,
      locale: values.locale,
      ownerEmail: values.ownerEmail,
    };

    startTransition(async () => {
      const result = await updateTenantDetailsAction(tenant.id, payload);
      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setFormError(result.error);
        return;
      }
      toast.success({
        command: 'tenant.details',
        state: 'saved',
        message: t('alertSuccess'),
      });
      router.refresh();
    });
  };

  const lockReasonText = (reason: TTenantFieldLockReason): string => {
    if (reason.kind === 'step') {
      return t('fieldLockedReasonStep', {
        step: tSteps(`stepLabel.${reason.step}`),
      });
    }
    if (reason.kind === 'succeeded') {
      return t('fieldLockedReasonSucceeded');
    }
    return t('fieldLockedReasonRunning');
  };

  const planOptions = [
    { value: TENANT_PLAN.FREE, label: t('planOptionFree') },
    { value: TENANT_PLAN.GROWTH, label: t('planOptionGrowth') },
  ];

  const textFields: { key: TTextFieldKey; label: string }[] = [
    { key: 'name', label: t('nameLabel') },
    { key: 'slug', label: t('slugLabel') },
    { key: 'primaryDomain', label: t('domainLabel') },
    { key: 'locale', label: t('localeLabel') },
    { key: 'ownerEmail', label: t('ownerEmailLabel') },
  ];

  const planLock = fieldLocks.plan;

  return (
    <div data-tenant-details-panel={panelId}>
      <Card>
        <Card.Header title={t('heading')} />
        <Card.Body>
          <div className={bodyStack()}>
            <span className={lockAnnouncementLive()} aria-live="assertive">
              {lockAnnouncement}
            </span>

            {formError && <Alert type={ALERT_TYPE.ERROR} title={formError} />}

            <div
              className={fields()}
              ref={fieldsContainerRef}
              tabIndex={-1}
              role="group"
              aria-label={t('fieldsGroupLabel')}
            >
              {textFields.map(({ key, label: labelText }) => {
                const id = TEXT_FIELD_ID[key];
                const errorId = `${id}-error`;
                const reasonId = `${id}-lock-reason`;
                const errorMessage = fieldErrors[key];
                const lock = fieldLocks[key];
                const describedBy =
                  [lock ? reasonId : null, errorMessage ? errorId : null]
                    .filter(Boolean)
                    .join(' ') || undefined;

                return (
                  <FormTextInput
                    key={key}
                    label={labelText}
                    htmlFor={id}
                    hint={
                      lock && (
                        <span id={reasonId} className={fieldLockReason()}>
                          {lockReasonText(lock)}
                        </span>
                      )
                    }
                    error={errorMessage}
                    type={TEXT_FIELD_TYPE[key]}
                    value={values[key]}
                    onChange={(nextValue) => updateField(key, nextValue)}
                    isInvalid={Boolean(errorMessage)}
                    isDisabled={Boolean(lock)}
                    aria-describedby={describedBy}
                  />
                );
              })}

              <FormField
                label={t('planLabel')}
                hint={
                  planLock && (
                    <span
                      id={`${PLAN_FIELD_ID}-lock-reason`}
                      className={fieldLockReason()}
                    >
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
                  aria-describedby={
                    planLock ? `${PLAN_FIELD_ID}-lock-reason` : undefined
                  }
                />
              </FormField>
            </div>
          </div>
        </Card.Body>

        <Card.Footer>
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            isDisabled={isPending || !isDirty}
          >
            {isPending ? t('savingButton') : t('saveButton')}
          </Button>
        </Card.Footer>
      </Card>
    </div>
  );
};
