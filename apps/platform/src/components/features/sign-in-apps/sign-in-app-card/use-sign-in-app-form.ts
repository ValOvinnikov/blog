'use client';

import {
  isOutcomeInvalid,
  isOutcomeRefused,
  isOutcomeSuccess,
  type TMaybeUndefined,
} from '@blog/config';
import { hasLength } from '@blog/utils/primitives';
import type { TSignInAppView } from '@platform/server/sign-in-apps/load-sign-in-apps';
import { saveSignInAppAction } from '@platform/server/sign-in-apps/save-sign-in-app-action';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

import {
  useSignInAppFields,
  type TSignInAppField,
} from './use-sign-in-app-fields';

export const useSignInAppForm = (tenantId: string, app: TSignInAppView) => {
  const t = useTranslations('signInAppsPage');
  const router = useRouter();
  const { provider } = app;
  const [saveError, setSaveError] = useState<TMaybeUndefined<string>>();
  const [savedMessage, setSavedMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const fields = useSignInAppFields(app, () => {
    setSaveError(undefined);
    setSavedMessage('');
  });
  const { saved, values, isDirty, showErrors, reset } = fields;
  const { clientId, clientSecret, isSecretEditable } = values;

  const save = () => {
    const missing: TSignInAppField[] = [
      ...(clientId.trim() ? [] : (['clientId'] as const)),
      ...(isSecretEditable && !clientSecret.trim()
        ? (['clientSecret'] as const)
        : []),
    ];
    if (hasLength(missing)) return showErrors(missing);

    startTransition(async () => {
      const result = await settleAction(
        saveSignInAppAction(tenantId, {
          provider,
          clientId,
          clientSecret: isSecretEditable ? clientSecret : undefined,
        }),
      );
      if (isOutcomeSuccess(result)) {
        reset({ hasOwnApp: true, clientId: clientId.trim() });
        setSavedMessage(
          t('saved', { provider: t(`providerName.${provider}`) }),
        );
        router.refresh();
        return;
      }
      const invalidFields = isOutcomeInvalid(result)
        ? (Object.keys(result.fieldErrors) as TSignInAppField[])
        : [];
      if (hasLength(invalidFields)) return showErrors(invalidFields);
      setSaveError(
        isOutcomeRefused(result)
          ? t(`refusal.${result.reason}`)
          : t('saveFailed'),
      );
    });
  };

  const clearApp = () => {
    reset({ hasOwnApp: false, clientId: '' });
    setSaveError(undefined);
    setSavedMessage('');
    router.refresh();
  };

  return {
    ...fields,
    provider,
    hasSave: !saved.hasOwnApp || isDirty,
    isPending,
    saveError,
    savedMessage,
    save,
    clearApp,
  };
};

export type TSignInAppForm = ReturnType<typeof useSignInAppForm>;
