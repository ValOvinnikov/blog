'use client';

import { useSignInAppGuard } from '@platform/components/features/sign-in-apps/sign-in-apps-guard-provider';
import type { TSignInAppView } from '@platform/server/sign-in-apps/load-sign-in-apps';
import { saveSignInAppAction } from '@platform/server/sign-in-apps/save-sign-in-app-action';
import { settleAction } from '@platform/utils/settle-action/settle-action';
import { useProviderName } from '@platform/utils/use-provider-name/use-provider-name';
import { useSignInAppFailureText } from '@platform/utils/use-sign-in-app-failure-text/use-sign-in-app-failure-text';
import {
  isOutcomeInvalid,
  isOutcomeSuccess,
  type TMaybeUndefined,
} from '@shinefold/config';
import { hasLength } from '@shinefold/utils/primitives';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { keys } from 'remeda';

import {
  useSignInAppFields,
  type TSignInAppField,
} from './use-sign-in-app-fields';

export const useSignInAppForm = (tenantId: string, app: TSignInAppView) => {
  const t = useTranslations('signInAppsPage');
  const toProviderName = useProviderName();
  const failureText = useSignInAppFailureText();
  const router = useRouter();
  const { provider } = app;
  const [saveError, setSaveError] = useState<TMaybeUndefined<string>>();
  const [savedMessage, setSavedMessage] = useState('');
  const [isPending, startTransition] = useTransition();

  const clearFeedback = () => {
    setSaveError(undefined);
    setSavedMessage('');
  };

  const fields = useSignInAppFields(app, clearFeedback);
  const { saved, values, isDirty, showErrors, reset } = fields;
  const { clientId, clientSecret, isSecretEditable } = values;

  const submit = async (): Promise<boolean> => {
    clearFeedback();
    const missing: TSignInAppField[] = [
      ...(clientId.trim() ? [] : (['clientId'] as const)),
      ...(isSecretEditable && !clientSecret.trim()
        ? (['clientSecret'] as const)
        : []),
    ];
    if (hasLength(missing)) {
      showErrors(missing);
      return false;
    }

    const result = await settleAction(
      saveSignInAppAction(tenantId, {
        provider,
        clientId,
        clientSecret: isSecretEditable ? clientSecret : undefined,
      }),
    );
    if (isOutcomeSuccess(result)) {
      reset({ hasOwnApp: true, clientId: clientId.trim() });
      setSaveError(undefined);
      setSavedMessage(t('saved', { provider: toProviderName(provider) }));
      router.refresh();
      return true;
    }
    const invalidFields = isOutcomeInvalid(result)
      ? keys(result.fieldErrors)
      : [];
    if (hasLength(invalidFields)) {
      showErrors(invalidFields);
      return false;
    }
    setSaveError(failureText(result, t('saveFailed')));
    return false;
  };

  const save = () =>
    startTransition(async () => {
      await submit();
    });

  useSignInAppGuard(provider, {
    changeCount: fields.changeCount,
    save: submit,
    discard: () => reset(saved),
  });

  const clearApp = () => {
    reset({ hasOwnApp: false, clientId: '' });
    clearFeedback();
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
