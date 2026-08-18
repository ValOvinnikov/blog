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
 * The tenant row's editable summary — inputs and a save control while
 * provisioning hasn't started (`editable`, the same `allIdle` condition the
 * "Start provisioning" button uses), otherwise the same values rendered as
 * static content once a run is under way or finished.
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

  const {
    root,
    list,
    row,
    label,
    value,
    fields,
    field,
    fieldLabel,
    fieldError,
    actions,
  } = tenantDetailsPanelVariants();

  function updateField<K extends keyof TFormValues>(
    key: K,
    fieldValue: TFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: fieldValue }));
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

  if (!editable) {
    const rows: { key: string; label: string; value: string }[] = [
      { key: 'name', label: t('nameLabel'), value: tenant.name },
      { key: 'slug', label: t('slugLabel'), value: tenant.slug },
      { key: 'domain', label: t('domainLabel'), value: tenant.primaryDomain },
      {
        key: 'plan',
        label: t('planLabel'),
        value: t(`planValue.${tenant.plan}`),
      },
      { key: 'locale', label: t('localeLabel'), value: tenant.locale },
    ];

    return (
      <div className={root()}>
        <Heading level={2} size={Size.XS}>
          {t('heading')}
        </Heading>
        <dl className={list()}>
          {rows.map((entry) => (
            <div className={row()} key={entry.key}>
              <dt className={label()}>{entry.label}</dt>
              <dd className={value()}>{entry.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  return (
    <div className={root()}>
      <Heading level={2} size={Size.XS}>
        {t('heading')}
      </Heading>

      {formError && <Alert type={ALERT_TYPE.ERROR} message={formError} />}

      <div className={fields()}>
        <div className={field()}>
          <label className={fieldLabel()} htmlFor="tenant-detail-name">
            {t('nameLabel')}
          </label>
          <TextInput
            id="tenant-detail-name"
            ariaLabel={t('nameLabel')}
            value={values.name}
            onChange={(fieldValue) => updateField('name', fieldValue)}
          />
          {fieldErrors.name && (
            <span className={fieldError()}>{fieldErrors.name}</span>
          )}
        </div>

        <div className={field()}>
          <label className={fieldLabel()} htmlFor="tenant-detail-slug">
            {t('slugLabel')}
          </label>
          <TextInput
            id="tenant-detail-slug"
            ariaLabel={t('slugLabel')}
            value={values.slug}
            onChange={(fieldValue) => updateField('slug', fieldValue)}
          />
          {fieldErrors.slug && (
            <span className={fieldError()}>{fieldErrors.slug}</span>
          )}
        </div>

        <div className={field()}>
          <label className={fieldLabel()} htmlFor="tenant-detail-domain">
            {t('domainLabel')}
          </label>
          <TextInput
            id="tenant-detail-domain"
            ariaLabel={t('domainLabel')}
            value={values.primaryDomain}
            onChange={(fieldValue) => updateField('primaryDomain', fieldValue)}
          />
          {fieldErrors.primaryDomain && (
            <span className={fieldError()}>{fieldErrors.primaryDomain}</span>
          )}
        </div>

        <div className={field()}>
          <span className={fieldLabel()}>{t('planLabel')}</span>
          <SegmentedControl<TTenantPlan>
            ariaLabel={t('planLabel')}
            options={planOptions}
            value={values.plan}
            onChange={(plan) => updateField('plan', plan)}
          />
        </div>

        <div className={field()}>
          <label className={fieldLabel()} htmlFor="tenant-detail-locale">
            {t('localeLabel')}
          </label>
          <TextInput
            id="tenant-detail-locale"
            ariaLabel={t('localeLabel')}
            value={values.locale}
            onChange={(fieldValue) => updateField('locale', fieldValue)}
          />
          {fieldErrors.locale && (
            <span className={fieldError()}>{fieldErrors.locale}</span>
          )}
        </div>
      </div>

      <div className={actions()}>
        <Button type="button" onClick={handleSave} disabled={isPending}>
          {isPending ? t('savingButton') : t('saveButton')}
        </Button>
      </div>
    </div>
  );
}
