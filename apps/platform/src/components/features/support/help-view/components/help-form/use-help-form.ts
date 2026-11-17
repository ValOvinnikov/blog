'use client';

import {
  SUPPORT_FIELD_ERROR,
  type TSupportFieldError,
} from '@platform/constants/support';
import { useToast } from '@platform/context/toast-provider';
import {
  sendSupportMessageAction,
  type TSendSupportMessageResult,
} from '@platform/server/support/send-support-message-action';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import {
  type ACTION_OUTCOME,
  isOutcomeInvalid,
  isOutcomeSuccess,
  type TFieldErrors,
  type TMaybeUndefined,
} from '@shinefold/config';
import { useState, useTransition } from 'react';

export const HELP_FIELD_ERROR_KEYS = {
  [SUPPORT_FIELD_ERROR.REQUIRED]: 'required',
  [SUPPORT_FIELD_ERROR.TOO_LONG]: 'tooLong',
} as const satisfies Record<TSupportFieldError, string>;

type THelpFailure = Exclude<
  TSendSupportMessageResult['outcome'],
  typeof ACTION_OUTCOME.SUCCESS | typeof ACTION_OUTCOME.INVALID
>;

export type TUseHelpFormMessages = Record<THelpFailure, string> & {
  sent: string;
};

const NO_ERRORS: TFieldErrors<'subject' | 'message', TSupportFieldError> = {};

export const useHelpForm = (
  tenantId: string,
  originPath: TMaybeUndefined<string>,
  messages: TUseHelpFormMessages,
) => {
  const toast = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState(NO_ERRORS);
  const [isPending, startTransition] = useTransition();

  const submit = () => {
    startTransition(async () => {
      const result = await settleAction(
        sendSupportMessageAction(tenantId, { subject, message, originPath }),
      );

      if (isOutcomeSuccess(result)) {
        setSubject('');
        setMessage('');
        setErrors(NO_ERRORS);
        toast.success({ message: messages.sent });
        return;
      }

      if (isOutcomeInvalid(result)) {
        setErrors(result.fieldErrors);
        return;
      }

      setErrors(NO_ERRORS);
      toast.error({ message: messages[result.outcome] });
    });
  };

  return {
    subject,
    message,
    setSubject,
    setMessage,
    errors,
    isPending,
    submit,
  };
};
