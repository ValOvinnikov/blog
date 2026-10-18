'use client';

import { ACTION_OUTCOME, ALERT_TYPE, FORM_STATUS } from '@blog/config';
import { Alert } from '@blog/ui/components/atoms/alert';
import { Button } from '@blog/ui/components/atoms/button';
import { TextInput } from '@blog/ui/components/atoms/text-input';
import { Textarea } from '@blog/ui/components/atoms/textarea';
import { ContactFormField } from '@web/modules/contact-form/components/contact-form-field/contact-form-field';
import { ContactFormSuccess } from '@web/modules/contact-form/components/contact-form-success/contact-form-success';
import {
  type TContactFormLocales,
  useContactForm,
} from '@web/modules/contact-form/hooks/use-contact-form/use-contact-form';
import type { TContactRefusal } from '@web/server/contact-form/contact-form-actions/contact-form-actions';
import type { TContactField } from '@web/utils/validate-contact-message/validate-contact-message';
import { useTranslations } from 'next-intl';
import { type ReactNode, useId } from 'react';

import { contactFormVariants } from './contact-form-variants';

const FIELD_MESSAGE_KEYS = {
  name: { label: 'nameLabel', error: 'errorName' },
  email: { label: 'emailLabel', error: 'errorEmail' },
  message: { label: 'messageLabel', error: 'errorMessage' },
} as const;

const REFUSAL_MESSAGE_KEYS = {
  [ACTION_OUTCOME.BLOCKED]: 'errorBlocked',
  [ACTION_OUTCOME.SERVER_ERROR]: 'errorServer',
} as const satisfies Record<TContactRefusal, string>;

export type TContactFormProps = TContactFormLocales & {
  successMessage: string;
  privacyNote?: ReactNode;
};

export const ContactForm = ({
  successMessage,
  privacyNote,
  currentLocale,
  defaultLocale,
}: TContactFormProps) => {
  const t = useTranslations('contactForm');
  const id = useId();
  const {
    formRef,
    fields,
    website,
    setWebsite,
    status,
    fieldErrors,
    refusal,
    changeField,
    submit,
  } = useContactForm({ currentLocale, defaultLocale });
  const s = contactFormVariants();

  const isSent = status === FORM_STATUS.SUCCESS;
  const isSubmitting = status === FORM_STATUS.SUBMITTING;

  const fieldInput = (field: TContactField) => {
    const label = t(FIELD_MESSAGE_KEYS[field].label);
    const isInvalid = fieldErrors[field] !== undefined;
    const inputProps = {
      id: `${id}-${field}`,
      value: fields[field],
      onChange: changeField(field),
      ariaLabel: label,
      isRequired: true,
      isInvalid,
      'aria-describedby': isInvalid ? `${id}-${field}-error` : undefined,
    };

    return (
      <ContactFormField
        inputId={inputProps.id}
        label={label}
        errorId={`${id}-${field}-error`}
        error={isInvalid ? t(FIELD_MESSAGE_KEYS[field].error) : undefined}
        className={field === 'message' ? s.fullWidth() : undefined}
      >
        {field === 'message' ? (
          <Textarea rows={6} {...inputProps} />
        ) : (
          <TextInput
            type={field === 'email' ? 'email' : 'text'}
            {...inputProps}
          />
        )}
      </ContactFormField>
    );
  };

  return (
    <>
      <div role="status">
        {isSent && (
          <ContactFormSuccess
            title={t('successTitle')}
            message={successMessage}
          />
        )}
      </div>
      {!isSent && (
        <form
          ref={formRef}
          noValidate={true}
          onSubmit={submit}
          className={s.form()}
        >
          {fieldInput('name')}
          {fieldInput('email')}
          {fieldInput('message')}
          <div aria-hidden="true" className={s.honeypot()}>
            <label htmlFor={`${id}-website`}>{t('honeypotLabel')}</label>
            <input
              id={`${id}-website`}
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
            />
          </div>
          {refusal && (
            <Alert
              type={ALERT_TYPE.ERROR}
              message={t(REFUSAL_MESSAGE_KEYS[refusal])}
              className={s.fullWidth()}
            />
          )}
          <div className={s.actions()}>
            <Button
              type="submit"
              isDisabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? t('submittingLabel') : t('submitLabel')}
            </Button>
            {privacyNote && (
              <div className={s.privacyNote()}>{privacyNote}</div>
            )}
          </div>
        </form>
      )}
    </>
  );
};
