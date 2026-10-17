'use client';

import {
  ICONS,
  type IWithClassName,
  SIZE,
  type TContentAlignment,
  type TFormStatus,
  type TMaybeUndefined,
  FORM_STATUS,
} from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { NewsletterSignup } from '@blog/ui/components/organisms/newsletter-signup';
import { subscribeToNewsletterAction } from '@web/server/newsletter/newsletter-actions/newsletter-actions';
import { isValidEmail } from '@web/utils/is-valid-email';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

const ERROR_MESSAGE_KEYS = {
  'already-subscribed': 'errorAlreadySubscribed',
  unavailable: 'errorUnavailable',
  invalid: 'errorInvalid',
  'rate-limited': 'errorRateLimited',
  'server-error': 'errorServer',
} as const;

const TRUST_CUE_ICONS = [ICONS.SHIELD_CHECK, ICONS.CLOSE];

type TNewsletterFormProps = IWithClassName & {
  variant: 'full' | 'compact';
  content?: string;
  trustCues?: string[];
  align?: TContentAlignment;
};

export const NewsletterForm = ({
  variant,
  content,
  trustCues,
  align,
  className,
}: TNewsletterFormProps) => {
  const t = useTranslations('newsletterForm');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<TFormStatus>(FORM_STATUS.IDLE);
  const [errorMessage, setErrorMessage] =
    useState<TMaybeUndefined<string>>(undefined);
  const errorMessageId = useId();

  const handleEmailChange = (value: string) => {
    setEmail(value);

    if (status === FORM_STATUS.ERROR) {
      setStatus(FORM_STATUS.IDLE);
      setErrorMessage(undefined);
    }
  };

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      setStatus(FORM_STATUS.ERROR);
      setErrorMessage(t('errorInvalid'));
      return;
    }

    setStatus(FORM_STATUS.SUBMITTING);
    setErrorMessage(undefined);

    const result = await subscribeToNewsletterAction(email);

    if (result.outcome === 'success') {
      setStatus(FORM_STATUS.SUCCESS);
      return;
    }

    setStatus(FORM_STATUS.ERROR);
    setErrorMessage(t(ERROR_MESSAGE_KEYS[result.outcome]));
  };

  const sharedProps = {
    email,
    onChange: handleEmailChange,
    onSubmit: handleSubmit,
    status,
    errorMessage,
    errorMessageId,
    successMessage: t('successMessage'),
    submitLabel: t('submitLabel'),
    emailAriaLabel: t('emailAriaLabel'),
    placeholder: t('placeholder'),
    align,
    className,
  };

  if (variant === 'compact') {
    return <NewsletterSignup.Compact {...sharedProps} />;
  }

  const trustCueItems = trustCues?.map((label, index) => ({
    icon: (
      <Icon
        name={TRUST_CUE_ICONS[index] ?? ICONS.SHIELD_CHECK}
        size={SIZE.SM}
      />
    ),
    label,
  }));

  return (
    <NewsletterSignup.Full
      {...sharedProps}
      supportingText={content}
      trustCues={trustCueItems}
    />
  );
};
