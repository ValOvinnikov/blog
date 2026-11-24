'use client';

import { Form } from '@base-ui/react/form';
import { Alert } from '@platform/components/shared/alert';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { FormField } from '@platform/components/shared/form-field';
import { OptionSelect } from '@platform/components/shared/option-select';
import { TextInput } from '@platform/components/shared/text-input';
import { BUTTON_VARIANT } from '@platform/constants/button';
import {
  INVITABLE_ADMIN_ROLE,
  type TAdminInviteFieldError,
} from '@platform/constants/platform-admins';
import { tv } from '@platform/utils/tv/tv';
import { ALERT_TYPE } from '@shinefold/config';
import type { TReasonedFailure } from '@shinefold/config/types';
import { ADMIN_INVITE_LIFETIME_DAYS } from '@shinefold/db/constants';
import { useTranslations } from 'next-intl';
import type { FormEvent } from 'react';

import { useInviteAdmin } from './use-invite-admin';

const inviteAdminCardVariants = tv({
  slots: {
    fields: ['flex flex-col gap-4'],
    footerActions: ['ml-auto flex items-center gap-2'],
  },
});

export const InviteAdminCard = () => {
  const t = useTranslations('inviteAdminCard');
  const tRole = useTranslations('roleLabel');
  const {
    email,
    changeEmail,
    role,
    changeRole,
    emailError,
    roleError,
    hasFailed,
    isPending,
    submit,
  } = useInviteAdmin((sentTo) => t('sent', { email: sentTo }));
  const errorText = (error?: TReasonedFailure<TAdminInviteFieldError>) =>
    error && t(`fieldError.${error.reason}`, error.values);
  const { fields, footerActions } = inviteAdminCardVariants();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit();
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Card>
        <Card.Header
          title={t('title')}
          supportingText={t('supportingText', {
            days: ADMIN_INVITE_LIFETIME_DAYS,
          })}
        />
        <Card.Body>
          <div className={fields()}>
            <FormField label={t('emailLabel')} error={errorText(emailError)}>
              <TextInput
                type="email"
                value={email}
                onChange={changeEmail}
                placeholder={t('emailPlaceholder')}
              />
            </FormField>
            <FormField
              label={t('roleLabel')}
              hint={t('roleHint')}
              error={errorText(roleError)}
            >
              <OptionSelect
                options={Object.values(INVITABLE_ADMIN_ROLE).map((value) => ({
                  value,
                  label: tRole(value),
                }))}
                value={role}
                onChange={changeRole}
              />
            </FormField>
            {hasFailed && (
              <Alert type={ALERT_TYPE.ERROR} title={t('sendFailed')} />
            )}
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
