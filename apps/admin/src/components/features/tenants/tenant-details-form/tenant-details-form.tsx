'use client';

import { Alert } from '@admin/components/shared/alert';
import { Button } from '@admin/components/shared/button';
import { Card } from '@admin/components/shared/card';
import { FormField } from '@admin/components/shared/form-field';
import { FormTextInput } from '@admin/components/shared/form-text-input';
import { PageHeader } from '@admin/components/shared/page-header';
import { Spinner } from '@admin/components/shared/spinner';
import {
  createTenantAction,
  type TCreateTenantFieldErrors,
} from '@admin/server/tenants/create-tenant-action';
import { ALERT_TYPE, Size } from '@blog/config';
import { TENANT_PLAN, type TTenantPlan } from '@blog/db/constants';
// `@blog/ui`'s SegmentedControl is kept here deliberately — it exposes
// `role="radiogroup"`/`role="radio"` (matching the untouched `tenant-details-panel`
// tests), while admin's own SegmentedControl is built on Base UI's Toggle
// Group (`role="group"` + `aria-pressed` buttons). Swapping would change the
// accessible shape of this control, which is behaviour, not styling.
import { SegmentedControl } from '@blog/ui/atoms/segmented-control';
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

type TOwnerInviteConfirmation = {
  email: string;
  message: string;
  token: string;
};

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

  const { root, cardWrap, cardInert, overlay, fields, hint, planControl } =
    tenantDetailsFormVariants({ pending: isPending });

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
    // The token itself is only echoed back when the email still matches —
    // the server re-verifies it against `ownerEmail`, so a stale token for a
    // different email is worthless to submit anyway.
    const normalizedOwnerEmail = values.ownerEmail.trim().toLowerCase();
    const confirmedInvite =
      ownerInviteConfirmation?.email === normalizedOwnerEmail
        ? ownerInviteConfirmation
        : undefined;

    startTransition(async () => {
      const result = await createTenantAction({
        ...values,
        confirmOwnerInviteToken: confirmedInvite?.token,
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
      <PageHeader title={t('heading')} description={t('description')} />

      {formError && <Alert type={ALERT_TYPE.ERROR} title={formError} />}

      <div className={cardWrap()}>
        <div className={cardInert()} inert={isPending}>
          <Card>
            <Card.Body>
              <div className={fields()}>
                <FormTextInput
                  label={t('nameLabel')}
                  htmlFor="tenant-name"
                  error={fieldErrors.name}
                  value={values.name}
                  onChange={(value) => updateField('name', value)}
                />

                <FormTextInput
                  label={t('slugLabel')}
                  htmlFor="tenant-slug"
                  hint={<span className={hint()}>{t('slugHint')}</span>}
                  error={fieldErrors.slug}
                  value={values.slug}
                  onChange={(value) => updateField('slug', value)}
                />

                <FormTextInput
                  label={t('domainLabel')}
                  htmlFor="tenant-domain"
                  hint={<span className={hint()}>{t('domainHint')}</span>}
                  error={fieldErrors.domain}
                  value={values.domain}
                  onChange={(value) => updateField('domain', value)}
                />

                <FormField label={t('planLabel')}>
                  <SegmentedControl<TTenantPlan>
                    ariaLabel={t('planLabel')}
                    options={planOptions}
                    value={values.plan}
                    onChange={(plan) => updateField('plan', plan)}
                    className={planControl()}
                  />
                </FormField>

                <FormTextInput
                  label={t('ownerEmailLabel')}
                  htmlFor="tenant-owner-email"
                  hint={<span className={hint()}>{t('ownerEmailHint')}</span>}
                  error={fieldErrors.ownerEmail}
                  footer={
                    ownerInviteConfirmation && (
                      <Alert
                        type={ALERT_TYPE.INFO}
                        title={ownerInviteConfirmation.message}
                      />
                    )
                  }
                  type="email"
                  value={values.ownerEmail}
                  onChange={(value) => updateField('ownerEmail', value)}
                />
              </div>
            </Card.Body>
            <Card.Footer>
              <Button
                type="button"
                variant="primary"
                onClick={handleSubmit}
                isDisabled={isPending}
              >
                {isPending
                  ? t('submittingButton')
                  : ownerInviteConfirmation
                    ? t('confirmOwnerInviteButton')
                    : t('submitButton')}
              </Button>
            </Card.Footer>
          </Card>
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
