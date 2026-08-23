'use client';

import {
  createTenantAction,
  type TCreateTenantFieldErrors,
} from '@admin/server/tenants/create-tenant-action';
import { ALERT_TYPE, Size } from '@blog/config';
import { TENANT_PLAN, type TTenantPlan } from '@blog/db/constants';
import { Alert } from '@blog/ui/atoms/alert';
import { Button } from '@blog/ui/atoms/button';
import { Heading } from '@blog/ui/atoms/heading';
import { SegmentedControl } from '@blog/ui/atoms/segmented-control';
import { Spinner } from '@blog/ui/atoms/spinner';
import { Text } from '@blog/ui/atoms/text';
import { TextInput } from '@blog/ui/atoms/text-input';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import { tenantDetailsFormVariants } from './tenant-details-form-variants';

type TFormValues = {
  name: string;
  slug: string;
  domain: string;
  plan: TTenantPlan;
  ownerEmail: string;
};

const INITIAL_VALUES: TFormValues = {
  name: '',
  slug: '',
  domain: '',
  plan: TENANT_PLAN.FREE,
  ownerEmail: '',
};

type TOwnerInviteConfirmation = { email: string; message: string };

/**
 * The wizard's Details step — the one part of tenant creation an operator
 * fills in by hand. Submitting calls `createTenantAction`, which redirects
 * straight to the new tenant's status page on success; every value this
 * component receives back from that call is therefore a validation failure
 * to show inline, never a success payload.
 */
export const TenantDetailsForm = () => {
  const t = useTranslations('tenantDetailsForm');
  const [values, setValues] = useState<TFormValues>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<TCreateTenantFieldErrors>({});
  const [formError, setFormError] = useState<string | undefined>(undefined);
  const [ownerInviteConfirmation, setOwnerInviteConfirmation] =
    useState<TOwnerInviteConfirmation | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    root,
    header,
    description,
    cardWrap,
    card,
    overlay,
    fields,
    field,
    label,
    hint,
    fieldError,
    actions,
    planControl,
  } = tenantDetailsFormVariants({ pending: isPending });

  const updateField = <K extends keyof TFormValues>(
    key: K,
    value: TFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    // A changed owner email invalidates whatever confirmation was shown for
    // the previous one — resubmitting now must re-check the new address
    // rather than silently reuse an unrelated confirmation.
    if (key === 'ownerEmail') {
      setOwnerInviteConfirmation(null);
    }
  };

  const handleSubmit = () => {
    setFormError(undefined);
    setFieldErrors({});

    // Only counts as confirmed when the operator hasn't edited the email
    // since seeing the confirmation — this second submit is what actually
    // proceeds down the invite path. `ownerInviteConfirmation.email` comes
    // back already normalized by the server's `z.string().trim().toLowerCase()`,
    // so the raw form value must be normalized the same way before comparing.
    const confirmOwnerInvite =
      ownerInviteConfirmation?.email === values.ownerEmail.trim().toLowerCase();

    startTransition(async () => {
      const result = await createTenantAction({
        ...values,
        confirmOwnerInvite,
      });
      setFieldErrors(result.fieldErrors ?? {});
      setFormError(result.error);
      setOwnerInviteConfirmation(result.ownerInviteConfirmation ?? null);
    });
  };

  const planOptions = [
    { value: TENANT_PLAN.FREE, label: t('planOptionFree') },
    { value: TENANT_PLAN.GROWTH, label: t('planOptionGrowth') },
  ];

  return (
    <div className={root()}>
      <div className={header()}>
        <Heading level={1} size={Size.MD}>
          {t('heading')}
        </Heading>
        <Text variant="muted" className={description()}>
          {t('description')}
        </Text>
      </div>

      {formError && <Alert type={ALERT_TYPE.ERROR} message={formError} />}

      <div className={cardWrap()}>
        <div className={card()} inert={isPending}>
          <div className={fields()}>
            <div className={field()}>
              <label className={label()} htmlFor="tenant-name">
                {t('nameLabel')}
              </label>
              <TextInput
                id="tenant-name"
                ariaLabel={t('nameLabel')}
                value={values.name}
                onChange={(value) => updateField('name', value)}
              />
              {fieldErrors.name && (
                <span className={fieldError()}>{fieldErrors.name}</span>
              )}
            </div>

            <div className={field()}>
              <label className={label()} htmlFor="tenant-slug">
                {t('slugLabel')}
              </label>
              <TextInput
                id="tenant-slug"
                ariaLabel={t('slugLabel')}
                value={values.slug}
                onChange={(value) => updateField('slug', value)}
              />
              <span className={hint()}>{t('slugHint')}</span>
              {fieldErrors.slug && (
                <span className={fieldError()}>{fieldErrors.slug}</span>
              )}
            </div>

            <div className={field()}>
              <label className={label()} htmlFor="tenant-domain">
                {t('domainLabel')}
              </label>
              <TextInput
                id="tenant-domain"
                ariaLabel={t('domainLabel')}
                value={values.domain}
                onChange={(value) => updateField('domain', value)}
              />
              <span className={hint()}>{t('domainHint')}</span>
              {fieldErrors.domain && (
                <span className={fieldError()}>{fieldErrors.domain}</span>
              )}
            </div>

            <div className={field()}>
              <span className={label()}>{t('planLabel')}</span>
              <SegmentedControl<TTenantPlan>
                ariaLabel={t('planLabel')}
                options={planOptions}
                value={values.plan}
                onChange={(plan) => updateField('plan', plan)}
                className={planControl()}
              />
            </div>

            <div className={field()}>
              <label className={label()} htmlFor="tenant-owner-email">
                {t('ownerEmailLabel')}
              </label>
              <TextInput
                id="tenant-owner-email"
                type="email"
                ariaLabel={t('ownerEmailLabel')}
                value={values.ownerEmail}
                onChange={(value) => updateField('ownerEmail', value)}
              />
              <span className={hint()}>{t('ownerEmailHint')}</span>
              {fieldErrors.ownerEmail && (
                <span className={fieldError()}>{fieldErrors.ownerEmail}</span>
              )}
              {ownerInviteConfirmation && (
                <Alert
                  type={ALERT_TYPE.INFO}
                  message={ownerInviteConfirmation.message}
                />
              )}
            </div>
          </div>

          <div className={actions()}>
            <Button type="button" onClick={handleSubmit} isDisabled={isPending}>
              {isPending
                ? t('submittingButton')
                : ownerInviteConfirmation
                  ? t('confirmOwnerInviteButton')
                  : t('submitButton')}
            </Button>
          </div>
        </div>

        {isPending && (
          <div className={overlay()}>
            <Spinner
              label={t('submittingButton')}
              size={Size.LG}
              hasLabel={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};
