'use client';

import { Form } from '@base-ui/react/form';
import { ALERT_TYPE, type TMaybeUndefined } from '@blog/config';
import { TermsAcceptanceCheckbox } from '@platform/components/features/sign-up/terms-acceptance-checkbox';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import type { TLegalPageUrls } from '@platform/utils/legal-page-urls/legal-page-urls';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';

import { signUpFormVariants } from './sign-up-form-variants';
import { useSignUp } from './use-sign-up';

export type TSignUpFormProps = {
  legalPageUrls: TMaybeUndefined<TLegalPageUrls>;
};

export const SignUpForm = ({ legalPageUrls }: TSignUpFormProps) => {
  const t = useTranslations('signUpForm');
  const {
    hasAcceptedTerms,
    changeAcceptance,
    termsError,
    isRefused,
    isPending,
    submit,
  } = useSignUp();
  const { root, submit: submitSlot } = signUpFormVariants();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  return (
    <Form className={root()} onSubmit={handleSubmit}>
      {isRefused && (
        <Alert
          type={ALERT_TYPE.ERROR}
          title={t('refusedTitle')}
          description={t('refusedDescription')}
        />
      )}
      <TermsAcceptanceCheckbox
        legalPageUrls={legalPageUrls}
        isChecked={hasAcceptedTerms}
        onCheckedChange={changeAcceptance}
        hasError={Boolean(termsError)}
      />
      <Button
        type="submit"
        variant="primary"
        isPending={isPending}
        pendingLabel={t('continuing')}
        className={submitSlot()}
      >
        {t('continue')}
      </Button>
    </Form>
  );
};
