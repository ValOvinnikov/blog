'use client';

import {
  updateTenantDetailsAction,
  type TUpdateTenantDetailsFieldErrors,
} from '@admin/server/tenants/update-tenant-details-action';
import { ALERT_TYPE, Size, TENANT_PLAN, type TTenantPlan } from '@blog/config';
import type { TTenant } from '@blog/db/schema/tenants';
import { Alert } from '@blog/ui/atoms/alert';
import { Button } from '@blog/ui/atoms/button';
import { Heading } from '@blog/ui/atoms/heading';
import { SegmentedControl } from '@blog/ui/atoms/segmented-control';
import { TextInput } from '@blog/ui/atoms/text-input';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { tenantDetailsPanelVariants } from './tenant-details-panel-variants';

export type TTenantDetailsPanelProps = {
  tenant: TTenant;
  editable: boolean;
};

type TFormValues = {
  name: string;
  slug: string;
  primaryDomain: string;
  plan: TTenantPlan;
  locale: string;
};

type TTextFieldKey = 'name' | 'slug' | 'primaryDomain' | 'locale';

const TEXT_FIELD_ID: Record<TTextFieldKey, string> = {
  name: 'tenant-detail-name',
  slug: 'tenant-detail-slug',
  primaryDomain: 'tenant-detail-domain',
  locale: 'tenant-detail-locale',
};

const PLAN_LABEL_ID = 'tenant-detail-plan-label';

function valuesFromTenant(tenant: TTenant): TFormValues {
  return {
    name: tenant.name,
    slug: tenant.slug,
    primaryDomain: tenant.primaryDomain,
    plan: tenant.plan,
    locale: tenant.locale,
  };
}

/**
 * The tenant row's summary — one render path for both states. While
 * provisioning hasn't started (`editable`, the same `allIdle` condition the
 * "Start provisioning" button uses) every field is a live control; once
 * anything has progressed past idle, the text fields go `readOnly` (kept
 * focusable and full-contrast, unlike `disabled`) and the plan field — the
 * one control HTML has no read-only state for — swaps to plain text.
 */
export function TenantDetailsPanel({
  tenant,
  editable,
}: TTenantDetailsPanelProps) {
  const t = useTranslations('tenantDetailsPanel');
  const router = useRouter();
  const [renderedTenant, setRenderedTenant] = useState(tenant);
  const [values, setValues] = useState<TFormValues>(() =>
    valuesFromTenant(tenant),
  );
  const [fieldErrors, setFieldErrors] =
    useState<TUpdateTenantDetailsFieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [isPending, startTransition] = useTransition();

  // A fresh `tenant` prop (a successful save's own `router.refresh()`)
  // should replace whatever the form last held — adjusted during render,
  // per React's guidance for state derived from props.
  if (tenant !== renderedTenant) {
    setRenderedTenant(tenant);
    setValues(valuesFromTenant(tenant));
  }

  const { root, fields, field, fieldLabel, fieldValue, fieldError, actions } =
    tenantDetailsPanelVariants();

  function updateField<K extends keyof TFormValues>(
    key: K,
    nextValue: TFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: nextValue }));
  }

  function handleSave() {
    setFormError(undefined);
    setFieldErrors({});

    startTransition(async () => {
      const result = await updateTenantDetailsAction(tenant.id, values);
      if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        setFormError(result.error);
        return;
      }
      router.refresh();
    });
  }

  const planOptions = [
    { value: TENANT_PLAN.FREE, label: t('planOptionFree') },
    { value: TENANT_PLAN.GROWTH, label: t('planOptionGrowth') },
  ];

  const textFields: { key: TTextFieldKey; label: string }[] = [
    { key: 'name', label: t('nameLabel') },
    { key: 'slug', label: t('slugLabel') },
    { key: 'primaryDomain', label: t('domainLabel') },
    { key: 'locale', label: t('localeLabel') },
  ];

  return (
    <div className={root()}>
      <Heading level={2} size={Size.XS}>
        {t('heading')}
      </Heading>

      {editable && formError && (
        <Alert type={ALERT_TYPE.ERROR} message={formError} />
      )}

      <div className={fields()}>
        {textFields.map(({ key, label: labelText }) => {
          const id = TEXT_FIELD_ID[key];
          const errorId = `${id}-error`;
          const errorMessage = editable ? fieldErrors[key] : undefined;

          return (
            <div className={field({ locked: !editable })} key={key}>
              <label className={fieldLabel()} htmlFor={id}>
                {labelText}
              </label>
              <TextInput
                id={id}
                ariaLabel={labelText}
                value={values[key]}
                onChange={(nextValue) => updateField(key, nextValue)}
                readOnly={!editable}
                invalid={Boolean(errorMessage)}
                aria-describedby={errorMessage ? errorId : undefined}
              />
              {errorMessage && (
                <span id={errorId} className={fieldError()}>
                  {errorMessage}
                </span>
              )}
            </div>
          );
        })}

        <div className={field({ locked: !editable })}>
          <span className={fieldLabel()} id={PLAN_LABEL_ID}>
            {t('planLabel')}
          </span>
          {editable ? (
            <SegmentedControl<TTenantPlan>
              ariaLabel={t('planLabel')}
              options={planOptions}
              value={values.plan}
              onChange={(plan) => updateField('plan', plan)}
            />
          ) : (
            <span className={fieldValue()} aria-labelledby={PLAN_LABEL_ID}>
              {t(`planValue.${values.plan}`)}
            </span>
          )}
        </div>
      </div>

      {editable && (
        <div className={actions()}>
          <Button type="button" onClick={handleSave} disabled={isPending}>
            {isPending ? t('savingButton') : t('saveButton')}
          </Button>
        </div>
      )}
    </div>
  );
}
