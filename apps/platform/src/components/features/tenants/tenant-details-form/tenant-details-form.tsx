'use client';

import { ALERT_TYPE, SIZE, type TMaybeUndefined } from '@blog/config';
import type { TTenantPlan } from '@blog/config/constants';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { FormField } from '@platform/components/shared/form-field';
import { FormLocaleSelect } from '@platform/components/shared/form-locale-select';
import { FormSiteAddressInput } from '@platform/components/shared/form-site-address-input';
import { FormTextInput } from '@platform/components/shared/form-text-input';
import { SegmentedControl } from '@platform/components/shared/segmented-control';
import { Spinner } from '@platform/components/shared/spinner';
import { TextInput } from '@platform/components/shared/text-input';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { usePlanOptions } from '@platform/utils/use-plan-options/use-plan-options';
import { useTenantFieldErrorText } from '@platform/utils/use-tenant-field-error-text/use-tenant-field-error-text';
import { useTranslations } from 'next-intl';

import { tenantDetailsFormVariants } from './tenant-details-form-variants';
import { useCreateTenantSubmit } from './use-create-tenant-submit';
import { useTenantDetailsValues } from './use-tenant-details-values';

export type TTenantDetailsFormProps = {
  rootDomain: TMaybeUndefined<string>;
};

export const TenantDetailsForm = ({ rootDomain }: TTenantDetailsFormProps) => {
  const t = useTranslations('tenantDetailsForm');
  const fieldErrorText = useTenantFieldErrorText();
  const planOptions = usePlanOptions();
  const {
    fieldErrors,
    isCreateFailed,
    ownerInviteConfirmation,
    clearOwnerInviteConfirmation,
    isPending,
    submit,
  } = useCreateTenantSubmit();
  const { values, updateValues } = useTenantDetailsValues(
    clearOwnerInviteConfirmation,
  );

  const { cardWrap, cardInert, overlay, fields, planControl, footerActions } =
    tenantDetailsFormVariants({ pending: isPending });

  const handleSubmit = () => submit(values);

  const pendingLabel = ownerInviteConfirmation
    ? t('submittingInviteButton')
    : t('submittingBeginButton');
  const idleLabel = ownerInviteConfirmation
    ? t('confirmOwnerInviteButton')
    : t('submitButton');

  return (
    <div className={cardWrap()}>
      <div
        className={cardInert()}
        inert={isPending}
        data-testid="tenant-details-form-inert"
      >
        <Card>
          <Card.Header title={t('heading')} supportingText={t('description')} />
          <Card.Body>
            <div className={fields()}>
              <FormTextInput
                label={t('nameLabel')}
                error={fieldErrorText(fieldErrors.name)}
                value={values.name}
                onChange={(value) => updateValues({ name: value })}
              />

              <FormSiteAddressInput
                label={t('siteAddressLabel')}
                hint={t('siteAddressHint')}
                error={fieldErrorText(fieldErrors.slug)}
                value={values.slug}
                onChange={(value) => updateValues({ slug: value })}
                rootDomain={rootDomain}
              />

              <FormLocaleSelect
                label={t('localeLabel')}
                hint={t('localeHint')}
                error={fieldErrorText(fieldErrors.locale)}
                value={values.locale}
                onChange={(locale) => updateValues({ locale })}
              />

              <FormField
                label={t('planLabel')}
                control={{ hasOwnAccessibleName: true }}
              >
                <SegmentedControl<TTenantPlan>
                  aria={{ label: t('planLabel') }}
                  options={planOptions}
                  value={values.plan}
                  onChange={(plan) => updateValues({ plan })}
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
                  onChange={(value) => updateValues({ ownerEmail: value })}
                />
              </FormField>
            </div>
          </Card.Body>
          <Card.Footer
            error={isCreateFailed ? t('errors.createFailed') : undefined}
          >
            <div className={footerActions()}>
              <Button
                type="button"
                variant={BUTTON_VARIANT.PRIMARY}
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
  );
};
