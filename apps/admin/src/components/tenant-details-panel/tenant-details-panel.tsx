'use client';

import {
  updateTenantDetailsAction,
  type TUpdateTenantDetailsFieldErrors,
} from '@admin/server/tenants/update-tenant-details-action';
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
import { useState, useTransition } from 'react';

import { tenantDetailsPanelVariants } from './tenant-details-panel-variants';

export type TTenantDetailsPanelProps = {
  tenant: TTenant;
  isEditable: boolean;
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

const PLAN_FIELD_ID = 'tenant-detail-plan';

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
 * The tenant row's summary — one render path for both states.
 */
export function TenantDetailsPanel({
  tenant,
  isEditable,
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

  const { root, fields, field, fieldLabel, fieldError, actions } =
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

      {isEditable && formError && (
        <Alert type={ALERT_TYPE.ERROR} message={formError} />
      )}

      <div className={fields()}>
        {textFields.map(({ key, label: labelText }) => {
          const id = TEXT_FIELD_ID[key];
          const errorId = `${id}-error`;
          const errorMessage = isEditable ? fieldErrors[key] : undefined;

          return (
            <div className={field()} key={key}>
              <label className={fieldLabel()} htmlFor={id}>
                {labelText}
              </label>
              <TextInput
                id={id}
                ariaLabel={labelText}
                value={values[key]}
                onChange={(nextValue) => updateField(key, nextValue)}
                isDisabled={!isEditable}
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

        <div className={field()}>
          <label className={fieldLabel()} htmlFor={PLAN_FIELD_ID}>
            {t('planLabel')}
          </label>
          {isEditable ? (
            <SegmentedControl<TTenantPlan>
              ariaLabel={t('planLabel')}
              options={planOptions}
              value={values.plan}
              onChange={(plan) => updateField('plan', plan)}
            />
          ) : (
            <TextInput
              id={PLAN_FIELD_ID}
              ariaLabel={t('planLabel')}
              value={t(`planValue.${values.plan}`)}
              onChange={() => undefined}
              isDisabled={true}
            />
          )}
        </div>
      </div>

      {isEditable && (
        <div className={actions()}>
          <Button type="button" onClick={handleSave} isDisabled={isPending}>
            {isPending ? t('savingButton') : t('saveButton')}
          </Button>
        </div>
      )}
    </div>
  );
}
