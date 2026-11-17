'use client';

import { Form } from '@base-ui/react/form';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { FormField } from '@platform/components/shared/form-field';
import { TextInput } from '@platform/components/shared/text-input';
import { Textarea } from '@platform/components/shared/textarea';
import { BUTTON_VARIANT } from '@platform/constants/button';
import type { TSupportFieldError } from '@platform/constants/support';
import {
  ACTION_OUTCOME,
  type TMaybeUndefined,
  type TReasonedFailure,
} from '@shinefold/config';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';

import { helpFormVariants } from './help-form-variants';
import { HELP_FIELD_ERROR_KEYS, useHelpForm } from './use-help-form';

const MESSAGE_ROWS = 8;

export type THelpFormProps = {
  tenantId: string;
  originPath?: string;
};

export const HelpForm = ({ tenantId, originPath }: THelpFormProps) => {
  const t = useTranslations('helpForm');
  const {
    subject,
    message,
    setSubject,
    setMessage,
    errors,
    isPending,
    submit,
  } = useHelpForm(tenantId, originPath, {
    sent: t('sent'),
    [ACTION_OUTCOME.RATE_LIMITED]: t('rateLimited'),
    [ACTION_OUTCOME.UNAVAILABLE]: t('unavailable'),
    [ACTION_OUTCOME.SERVER_ERROR]: t('sendFailed'),
  });
  const { fields, footerActions } = helpFormVariants();
  const errorText = (
    error: TMaybeUndefined<TReasonedFailure<TSupportFieldError>>,
  ) => error && t(HELP_FIELD_ERROR_KEYS[error.reason], error.values);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Card>
        <Card.Header title={t('title')} supportingText={t('responseTime')} />
        <Card.Body>
          <div className={fields()}>
            <FormField
              label={t('subjectLabel')}
              error={errorText(errors.subject)}
            >
              <TextInput value={subject} onChange={setSubject} />
            </FormField>
            <FormField
              label={t('messageLabel')}
              hint={t('messageHint')}
              error={errorText(errors.message)}
            >
              <Textarea
                value={message}
                onChange={setMessage}
                rows={MESSAGE_ROWS}
              />
            </FormField>
          </div>
        </Card.Body>
        <Card.Footer>
          <div className={footerActions()}>
            <Button
              type="submit"
              variant={BUTTON_VARIANT.PRIMARY}
              isPending={isPending}
              pendingLabel={t('sending')}
            >
              {t('send')}
            </Button>
          </div>
        </Card.Footer>
      </Card>
    </Form>
  );
};
