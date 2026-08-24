'use client';

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
import { ALERT_TYPE, Size } from '@blog/config';
import { TENANT_PLAN, type TTenantPlan } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { Alert } from '@blog/ui/atoms/alert';
import { Button } from '@blog/ui/atoms/button';
import { Heading } from '@blog/ui/atoms/heading';
import { SegmentedControl } from '@blog/ui/atoms/segmented-control';
import { TextInput } from '@blog/ui/atoms/text-input';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useId, useLayoutEffect, useRef, useState, useTransition } from 'react';

import { tenantDetailsPanelVariants } from './tenant-details-panel-variants';

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

const lockedFieldKeysOf = (
  fieldLocks: TTenantFieldLocks,
): TTenantFieldKey[] => {
  return Object.keys(fieldLocks) as TTenantFieldKey[];
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
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [lockAnnouncement, setLockAnnouncement] = useState('');
  const [shouldMoveFocusOnTransition, setShouldMoveFocusOnTransition] =
    useState(false);
  const lockedFieldKeys = lockedFieldKeysOf(fieldLocks);
  const [renderedLockedFieldsKey, setRenderedLockedFieldsKey] = useState(() =>
    [...lockedFieldKeys].sort().join(','),
  );
  const fieldsContainerRef = useRef<HTMLDivElement>(null);
  const isMountRef = useRef(true);

  // A fresh `tenant`/`ownerEmail` prop (a successful save's own
  // `router.refresh()`) should replace whatever the form last held —
  // adjusted during render, per React's guidance for state derived from
  // props.
  if (tenant !== renderedTenant || ownerEmail !== renderedOwnerEmail) {
    setRenderedTenant(tenant);
    setRenderedOwnerEmail(ownerEmail);
    setValues(valuesFromProps(tenant, ownerEmail));
  }

  // Same derived-during-render pattern: only an actual change to which
  // fields are locked updates the announcement, never an unrelated
  // re-render. The transition is driven by a background poll, not user
  // action, so whether to move focus is decided here too —
  // `document.activeElement` still reflects the pre-transition DOM at this
  // point, before React commits the disabled-state swap and any focused
  // descendant auto-blurs to the body.
  const nextLockedFieldsKey = [...lockedFieldKeys].sort().join(',');
  if (nextLockedFieldsKey !== renderedLockedFieldsKey) {
    const previousLockedKeys = new Set(
      renderedLockedFieldsKey ? renderedLockedFieldsKey.split(',') : [],
    );
    const previousLockedCount = previousLockedKeys.size;
    const newlyLockedKeys = lockedFieldKeys.filter(
      (key) => !previousLockedKeys.has(key),
    );
    setRenderedLockedFieldsKey(nextLockedFieldsKey);
    if (lockedFieldKeys.length > previousLockedCount) {
      setLockAnnouncement(t('lockedAnnouncement'));
    } else if (lockedFieldKeys.length < previousLockedCount) {
      setLockAnnouncement(t('unlockedAnnouncement'));
    }
    setShouldMoveFocusOnTransition(
      Boolean(
        document.activeElement?.closest(
          `[data-tenant-details-panel="${panelId}"]`,
        ),
      ),
    );
    // A field that just locked (e.g. a background poll catching up to a
    // step another operator retried) may still hold an unsaved edit —
    // discard it back to the server value rather than leave a disabled
    // control displaying input that was never saved and can no longer be
    // submitted.
    if (newlyLockedKeys.length > 0) {
      const baseline = valuesFromProps(tenant, ownerEmail);
      setValues((prev) => {
        const next = { ...prev };
        for (const key of newlyLockedKeys) {
          resetFieldToBaseline(next, baseline, key);
        }
        return next;
      });
    }
  }

  // A layout effect commits after the live-region text mutation above and
  // before paint, so the focus move lands after that text is in the DOM
  // rather than racing it.
  useLayoutEffect(() => {
    if (isMountRef.current) {
      isMountRef.current = false;
      return;
    }
    if (!shouldMoveFocusOnTransition) {
      return;
    }
    fieldsContainerRef.current?.focus();
  }, [renderedLockedFieldsKey, shouldMoveFocusOnTransition]);

  const {
    root,
    fields,
    field,
    fieldLabel,
    fieldError,
    fieldLockReason,
    lockedValue,
    actions,
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
    setShowSaveSuccess(false);
  };

  const handleSave = () => {
    setFormError(undefined);
    setFieldErrors({});
    setShowSaveSuccess(false);

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
      setShowSaveSuccess(true);
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
  const planLabel =
    planOptions.find((option) => option.value === values.plan)?.label ??
    values.plan;

  const textFields: { key: TTextFieldKey; label: string }[] = [
    { key: 'name', label: t('nameLabel') },
    { key: 'slug', label: t('slugLabel') },
    { key: 'primaryDomain', label: t('domainLabel') },
    { key: 'locale', label: t('localeLabel') },
    { key: 'ownerEmail', label: t('ownerEmailLabel') },
  ];

  const planLock = fieldLocks.plan;

  return (
    <div className={root()} data-tenant-details-panel={panelId}>
      <Heading level={2} size={Size.XS}>
        {t('heading')}
      </Heading>

      <span className={lockAnnouncementLive()} aria-live="assertive">
        {lockAnnouncement}
      </span>

      {showSaveSuccess && (
        <Alert type={ALERT_TYPE.SUCCESS} message={t('alertSuccess')} />
      )}
      {formError && <Alert type={ALERT_TYPE.ERROR} message={formError} />}

      <div className={fields()} ref={fieldsContainerRef} tabIndex={-1}>
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
            <div className={field()} key={key}>
              <label className={fieldLabel()} htmlFor={id}>
                {labelText}
              </label>
              <TextInput
                id={id}
                type={TEXT_FIELD_TYPE[key]}
                ariaLabel={labelText}
                value={values[key]}
                onChange={(nextValue) => updateField(key, nextValue)}
                isInvalid={Boolean(errorMessage)}
                isDisabled={Boolean(lock)}
                aria-describedby={describedBy}
              />
              {lock && (
                <span id={reasonId} className={fieldLockReason()}>
                  {lockReasonText(lock)}
                </span>
              )}
              {errorMessage && (
                <span id={errorId} className={fieldError()}>
                  {errorMessage}
                </span>
              )}
            </div>
          );
        })}

        <div className={field()}>
          {planLock ? (
            <>
              <span className={fieldLabel()} id={`${PLAN_FIELD_ID}-label`}>
                {t('planLabel')}
              </span>
              <p
                className={lockedValue()}
                role="group"
                aria-labelledby={`${PLAN_FIELD_ID}-label`}
                aria-describedby={`${PLAN_FIELD_ID}-lock-reason`}
              >
                {planLabel}
              </p>
              <span
                id={`${PLAN_FIELD_ID}-lock-reason`}
                className={fieldLockReason()}
              >
                {lockReasonText(planLock)}
              </span>
            </>
          ) : (
            <>
              <label className={fieldLabel()} htmlFor={PLAN_FIELD_ID}>
                {t('planLabel')}
              </label>
              <SegmentedControl<TTenantPlan>
                ariaLabel={t('planLabel')}
                options={planOptions}
                value={values.plan}
                onChange={(plan) => updateField('plan', plan)}
                className={planControl()}
              />
            </>
          )}
        </div>
      </div>

      <div className={actions()}>
        <Button
          type="button"
          onClick={handleSave}
          isDisabled={isPending || !isDirty}
        >
          {isPending ? t('savingButton') : t('saveButton')}
        </Button>
      </div>
    </div>
  );
};
