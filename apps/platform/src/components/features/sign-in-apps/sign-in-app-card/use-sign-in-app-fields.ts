'use client';

import type { TSignInAppView } from '@platform/server/sign-in-apps/load-sign-in-apps';
import { useTranslations } from 'next-intl';
import { useRef, useState } from 'react';

export type TSignInAppField = 'clientId' | 'clientSecret';
type TFieldErrors = Partial<Record<TSignInAppField, string>>;
type TSavedApp = { hasOwnApp: boolean; clientId: string };

const FIELD_ERROR_KEYS = {
  clientId: 'fieldError.clientIdRequired',
  clientSecret: 'fieldError.clientSecretRequired',
} as const satisfies Record<TSignInAppField, string>;

export const useSignInAppFields = (app: TSignInAppView, onEdit: () => void) => {
  const t = useTranslations('signInAppsPage');
  const [saved, setSaved] = useState<TSavedApp>({
    hasOwnApp: app.hasOwnApp,
    clientId: app.clientId ?? '',
  });
  const [clientId, setClientId] = useState(saved.clientId);
  const [clientSecret, setClientSecret] = useState('');
  const [isReplacing, setIsReplacing] = useState(false);
  const [isClientIdShown, setIsClientIdShown] = useState(false);
  const [isSecretShown, setIsSecretShown] = useState(false);
  const [errors, setErrors] = useState<TFieldErrors>({});
  const clientIdRef = useRef<HTMLInputElement>(null);
  const clientSecretRef = useRef<HTMLInputElement>(null);

  const edit = (field: TSignInAppField, value: string) => {
    (field === 'clientId' ? setClientId : setClientSecret)(value);
    setErrors((current) => ({ ...current, [field]: undefined }));
    onEdit();
  };

  const showErrors = (fields: TSignInAppField[]) => {
    setErrors(
      Object.fromEntries(
        fields.map((field) => [field, t(FIELD_ERROR_KEYS[field])]),
      ),
    );
    if (fields.includes('clientId')) {
      setIsClientIdShown(true);
      clientIdRef.current?.focus();
      return;
    }
    clientSecretRef.current?.focus();
  };

  const reset = (next: TSavedApp) => {
    setSaved(next);
    setClientId(next.clientId);
    setClientSecret('');
    setIsReplacing(false);
    setIsClientIdShown(false);
    setIsSecretShown(false);
    setErrors({});
  };

  const isSecretEditable = !saved.hasOwnApp || isReplacing;

  return {
    saved,
    values: { clientId, clientSecret, isSecretEditable },
    isDirty: clientId !== saved.clientId || isReplacing || clientSecret !== '',
    clientId: {
      value: clientId,
      error: errors.clientId,
      onChange: (value: string) => edit('clientId', value),
    },
    clientSecret: {
      value: clientSecret,
      error: errors.clientSecret,
      onChange: (value: string) => edit('clientSecret', value),
    },
    clientIdReveal: {
      isShown: isClientIdShown,
      onShownChange: setIsClientIdShown,
    },
    clientSecretReveal: {
      isShown: isSecretShown,
      onShownChange: setIsSecretShown,
    },
    replace: {
      isOpen: isReplacing,
      onOpenChange: (isOpen: boolean) => {
        setIsReplacing(isOpen);
        setIsSecretShown(false);
        edit('clientSecret', '');
      },
    },
    clientIdRef,
    clientSecretRef,
    showErrors,
    reset,
  };
};

export type TSignInAppFields = ReturnType<typeof useSignInAppFields>;
