'use client';

import {
  ACTION_OUTCOME,
  ICONS,
  SIZE,
  type TContentAlignment,
  type TFormStatus,
  type TMaybeUndefined,
  FORM_STATUS,
} from '@blog/config';
import { isValidEmailAddress } from '@blog/email/validation';
import { Icon } from '@blog/ui/components/atoms/icon';
import { NewsletterSignup } from '@blog/ui/components/organisms/newsletter-signup';
import { NEWSLETTER_OUTCOME } from '@web/constants/newsletter';
import { useBusyStyle } from '@web/context/busy-style-provider';
import {
  subscribeToNewsletterAction,
  type TSubscribeResult,
} from '@web/server/newsletter/newsletter-actions/newsletter-actions';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

const ERROR_MESSAGE_KEYS = {
  [NEWSLETTER_OUTCOME.ALREADY_SUBSCRIBED]: 'errorAlreadySubscribed',
  [ACTION_OUTCOME.UNAVAILABLE]: 'errorUnavailable',
  [ACTION_OUTCOME.INVALID]: 'errorInvalid',
  [ACTION_OUTCOME.RATE_LIMITED]: 'errorRateLimited',
  [ACTION_OUTCOME.SERVER_ERROR]: 'errorServer',
} as const satisfies Record<
  Exclude<TSubscribeResult['outcome'], typeof ACTION_OUTCOME.SUCCESS>,
  string
>;

const TRUST_CUE_ICONS = [ICONS.SHIELD_CHECK, ICONS.CLOSE];

interface INewsletterFormProps {
  variant: 'full' | 'compact';
  content?: string;
  trustCues?: string[];
  align?: TContentAlignment;
}

export const NewsletterForm = ({
  variant,
  content,
  trustCues,
  align,
}: INewsletterFormProps) => {
  const t = useTranslations('newsletterForm');
  const { busyStyle, spinnerVariant } = useBusyStyle();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<TFormStatus>(FORM_STATUS.IDLE);
  const [errorMessage, setErrorMessage] =
    useState<TMaybeUndefined<string>>(undefined);

  const handleEmailChange = (value: string) => {
    setEmail(value);

    if (status === FORM_STATUS.ERROR) {
      setStatus(FORM_STATUS.IDLE);
      setErrorMessage(undefined);
    }
  };

  const handleSubmit = async () => {
    if (!isValidEmailAddress(email.trim())) {
      setStatus(FORM_STATUS.ERROR);
      setErrorMessage(t('errorInvalid'));
      return;
    }

    setStatus(FORM_STATUS.SUBMITTING);
    setErrorMessage(undefined);

    const result = await subscribeToNewsletterAction(email);

    if (result.outcome === ACTION_OUTCOME.SUCCESS) {
      setStatus(FORM_STATUS.SUCCESS);
      return;
    }

    setStatus(FORM_STATUS.ERROR);
    setErrorMessage(t(ERROR_MESSAGE_KEYS[result.outcome]));
  };

  const form = (
    <NewsletterSignup.Form
      email={email}
      onChange={handleEmailChange}
      onSubmit={handleSubmit}
      status={status}
      variant={variant}
      busyStyle={busyStyle}
      spinnerVariant={spinnerVariant}
    >
      <NewsletterSignup.Input
        emailAriaLabel={t('emailAriaLabel')}
        placeholder={t('placeholder')}
      />
      <NewsletterSignup.Submit
        submitLabel={t('submitLabel')}
        busyLabel={t('submittingLabel')}
      />
      <NewsletterSignup.Status
        successMessage={t('successMessage')}
        errorMessage={errorMessage}
      />
    </NewsletterSignup.Form>
  );

  if (variant === 'compact') {
    return (
      <NewsletterSignup.Compact align={align}>{form}</NewsletterSignup.Compact>
    );
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
      supportingText={content}
      trustCues={trustCueItems}
      align={align}
    >
      {form}
    </NewsletterSignup.Full>
  );
};
