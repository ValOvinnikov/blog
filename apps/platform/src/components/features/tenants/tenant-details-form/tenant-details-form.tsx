'use client';

import { ALERT_TYPE, SIZE } from '@blog/config';
import { TENANT_PLAN, type TTenantPlan } from '@blog/db/constants';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { FormField } from '@platform/components/shared/form-field';
import { FormTextInput } from '@platform/components/shared/form-text-input';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { Spinner } from '@platform/components/shared/spinner';
import { TextInput } from '@platform/components/shared/text-input';
import { useTenantFieldErrorText } from '@platform/utils/use-tenant-field-error-text/use-tenant-field-error-text';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { tenantDetailsFormVariants } from './tenant-details-form-variants';
import { useCreateTenantSubmit } from './use-create-tenant-submit';

type TFormValues = {
  name: string;
  domain: string;
  plan: TTenantPlan;
  ownerEmail: string;
};

const INITIAL_VALUES: TFormValues = {
  name: '',
  domain: '',
  plan: TENANT_PLAN.FREE,
  ownerEmail: '',
};

export const TenantDetailsForm = () => {
  const t = useTranslations('tenantDetailsForm');
  const fieldErrorText = useTenantFieldErrorText();
  const [values, setValues] = useState<TFormValues>(INITIAL_VALUES);
  const {
    fieldErrors,
    isCreateFailed,
    ownerInviteConfirmation,
    clearOwnerInviteConfirmation,
    isPending,
    submit,
  } = useCreateTenantSubmit();

  const {
    root,
    cardWrap,
    cardInert,
    overlay,
    fields,
    planControl,
    footerActions,
  } = tenantDetailsFormVariants({ pending: isPending });

  const updateField = <K extends keyof TFormValues>(
    key: K,
    value: TFormValues[K],
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (key === 'ownerEmail') {
      clearOwnerInviteConfirmation();
    }
  };

  const handleSubmit = () => submit(values);

  const planOptions = [
    { value: TENANT_PLAN.FREE, label: t('planOptionFree') },
    { value: TENANT_PLAN.GROWTH, label: t('planOptionGrowth') },
  ];

  const pendingLabel = ownerInviteConfirmation
    ? t('submittingInviteButton')
    : t('submittingBeginButton');
  const idleLabel = ownerInviteConfirmation
    ? t('confirmOwnerInviteButton')
    : t('submitButton');

  return (
    <div className={root()}>
      {isCreateFailed && (
        <Alert type={ALERT_TYPE.ERROR} title={t('errors.createFailed')} />
      )}

      <div className={cardWrap()}>
        <div
          className={cardInert()}
          inert={isPending}
          data-testid="tenant-details-form-inert"
        >
          <Card>
            <Card.Header
              title={t('heading')}
              supportingText={t('description')}
            />
            <Card.Body>
              <div className={fields()}>
                <FormTextInput
                  label={t('nameLabel')}
                  error={fieldErrorText(fieldErrors.name)}
                  value={values.name}
                  onChange={(value) => updateField('name', value)}
                />

                <FormTextInput
                  label={t('domainLabel')}
                  hint={t('domainHint')}
                  error={fieldErrorText(fieldErrors.domain)}
                  value={values.domain}
                  onChange={(value) => updateField('domain', value)}
                />

                <FormField
                  label={t('planLabel')}
                  control={{ hasOwnAccessibleName: true }}
                >
                  <SegmentedControl<TTenantPlan>
                    ariaLabel={t('planLabel')}
                    options={planOptions}
                    value={values.plan}
                    onChange={(plan) => updateField('plan', plan)}
                    className={planControl()}
                  />
                </FormField>

                <FormField
                  label={t('ownerEmailLabel')}
                  hint={t('ownerEmailHint')}
                  error={fieldErrorText(fieldErrors.ownerEmail)}
                  footer={
                    ownerInviteConfirmation && (
                      <Alert
                        type={ALERT_TYPE.INFO}
                        title={t('ownerInviteConfirmation', {
                          email: ownerInviteConfirmation.email,
                        })}
                      />
                    )
                  }
                >
                  <TextInput
                    type="email"
                    value={values.ownerEmail}
                    onChange={(value) => updateField('ownerEmail', value)}
                  />
                </FormField>
              </div>
            </Card.Body>
            <Card.Footer>
              <div className={footerActions()}>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSubmit}
                  isPending={isPending}
                  hasArrow={!isPending}
                >
                  {isPending ? pendingLabel : idleLabel}
                </Button>
              </div>
            </Card.Footer>
          </Card>
        </div>

        {isPending && (
          <div className={overlay()}>
            <Spinner label={pendingLabel} size={SIZE.LG} hasLabel={true} />
          </div>
        )}
      </div>
    </div>
  );
};
