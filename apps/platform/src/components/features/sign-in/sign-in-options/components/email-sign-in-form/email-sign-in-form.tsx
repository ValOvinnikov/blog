'use client';

import { Form } from '@base-ui/react/form';
import { ACTION_OUTCOME, ALERT_TYPE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { FormTextInput } from '@platform/components/shared/form-text-input';
import { BUTTON_VARIANT } from '@platform/constants/button';
import type { TSendSignInLinkRefusal } from '@platform/server/auth/send-sign-in-link-action';
import { tv } from '@platform/utils/tv/tv';
import { useTenantFieldErrorText } from '@platform/utils/use-tenant-field-error-text/use-tenant-field-error-text';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';

import { useEmailSignIn } from './use-email-sign-in';

const SEND_REFUSAL_KEYS = {
  [ACTION_OUTCOME.RATE_LIMITED]: {
    title: 'sendLimitedTitle',
    description: 'sendLimitedDescription',
  },
  [ACTION_OUTCOME.SERVER_ERROR]: {
    title: 'sendFailedTitle',
    description: 'sendFailedDescription',
  },
} as const satisfies Record<
  TSendSignInLinkRefusal,
  { title: string; description: string }
>;

const emailSignInFormVariants = tv({
  slots: {
    root: ['flex flex-col gap-4'],
    submit: ['w-full justify-center'],
  },
});

export type TEmailSignInFormProps = {
  callbackPath: string;
  isSignUp: boolean;
};

export const EmailSignInForm = ({
  callbackPath,
  isSignUp,
}: TEmailSignInFormProps) => {
  const t = useTranslations('emailSignInForm');
  const {
    email,
    setEmail,
    sentTo,
    emailError,
    sendRefusal,
    isPending,
    submit,
  } = useEmailSignIn({ callbackPath, isSignUp });
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
      {sendRefusal && (
        <Alert
          type={ALERT_TYPE.ERROR}
          title={t(SEND_REFUSAL_KEYS[sendRefusal].title)}
          description={t(SEND_REFUSAL_KEYS[sendRefusal].description)}
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
        variant={BUTTON_VARIANT.PRIMARY}
        isPending={isPending}
        pendingLabel={t('sending')}
        className={submitSlot()}
      >
        {t('sendLink')}
      </Button>
    </Form>
  );
};
