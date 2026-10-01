'use client';

import {
  ICONS,
  SIZE,
  type TContentAlignment,
  type TFormStatus,
} from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { NewsletterSignup } from '@blog/ui/components/organisms/newsletter-signup';
import { subscribeToNewsletterAction } from '@web/server/newsletter/newsletter-actions';
import { isValidEmail } from '@web/utils/is-valid-email';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

const TRUST_CUE_ICONS = [ICONS.SHIELD_CHECK, ICONS.CLOSE];

type TNewsletterFormProps = {
  variant: 'full' | 'compact';
  heading: string;
  headingId?: string;
  supportingText?: string;
  trustCues?: string[];
  align?: TContentAlignment;
  className?: string;
};

export const NewsletterForm = ({
  variant,
  heading,
  headingId,
  supportingText,
  trustCues,
  align,
  className,
}: TNewsletterFormProps) => {
  const t = useTranslations('newsletterForm');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<TFormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined,
  );
  const errorMessageId = useId();

  const handleEmailChange = (value: string) => {
    setEmail(value);

    if (status === 'error') {
      setStatus('idle');
      setErrorMessage(undefined);
    }
  };

  const handleSubmit = async () => {
    if (!isValidEmail(email)) {
      setStatus('error');
      setErrorMessage(t('errorInvalid'));
      return;
    }

    setStatus('submitting');
    setErrorMessage(undefined);

    const result = await subscribeToNewsletterAction(email);

    if (result.outcome === 'success') {
      setStatus('success');
      return;
    }

    setStatus('error');
    setErrorMessage(
      result.outcome === 'already-subscribed'
        ? t('errorAlreadySubscribed')
        : t('errorServer'),
    );
  };

  const sharedProps = {
    email,
    onChange: handleEmailChange,
    onSubmit: handleSubmit,
    status,
    heading,
    headingId,
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
      supportingText={supportingText}
      trustCues={trustCueItems}
    />
  );
};
