'use client';

import { Form } from '@base-ui/react/form';
import { ALERT_TYPE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { FormTextInput } from '@platform/components/shared/form-text-input';
import { tv } from '@platform/utils/tv/tv';
import { useTenantFieldErrorText } from '@platform/utils/use-tenant-field-error-text/use-tenant-field-error-text';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';

import { useEmailSignIn } from './use-email-sign-in';

const emailSignInFormVariants = tv({
  slots: {
    root: ['flex flex-col gap-4'],
    submit: ['w-full justify-center'],
  },
});

export type TEmailSignInFormProps = {
  callbackPath: string;
};

export const EmailSignInForm = ({ callbackPath }: TEmailSignInFormProps) => {
  const t = useTranslations('emailSignInForm');
  const {
    email,
    setEmail,
    sentTo,
    emailError,
    hasSendFailed,
    isPending,
    submit,
  } = useEmailSignIn(callbackPath);
  const fieldErrorText = useTenantFieldErrorText();
  const { root, submit: submitSlot } = emailSignInFormVariants();

  if (sentTo) {
    return (
      <Alert
        type={ALERT_TYPE.SUCCESS}
        title={t('linkSentTitle')}
        description={t('linkSentDescription', { email: sentTo })}
      />
    );
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  return (
    <Form className={root()} onSubmit={handleSubmit}>
      {hasSendFailed && (
        <Alert
          type={ALERT_TYPE.ERROR}
          title={t('sendFailedTitle')}
          description={t('sendFailedDescription')}
        />
      )}
      <FormTextInput
        label={t('emailLabel')}
        hint={t('emailHint')}
        error={fieldErrorText(emailError)}
        type="email"
        placeholder={t('emailPlaceholder')}
        value={email}
        onChange={setEmail}
      />
      <Button
        type="submit"
        variant="primary"
        isPending={isPending}
        pendingLabel={t('sending')}
        className={submitSlot()}
      >
        {t('sendLink')}
      </Button>
    </Form>
  );
};
