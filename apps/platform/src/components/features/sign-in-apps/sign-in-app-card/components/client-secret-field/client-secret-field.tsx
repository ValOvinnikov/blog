'use client';

import { SIZE } from '@blog/config';
import { RevealToggle } from '@platform/components/features/sign-in-apps/reveal-toggle';
import type { TSignInAppFields } from '@platform/components/features/sign-in-apps/sign-in-app-card/use-sign-in-app-fields';
import { Button } from '@platform/components/shared/button';
import { FormField } from '@platform/components/shared/form-field';
import { TextInput } from '@platform/components/shared/text-input';
import { UnsavedDot } from '@platform/components/shared/unsaved-dot';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';

import { clientSecretFieldVariants } from './client-secret-field-variants';

export type TClientSecretFieldProps = {
  fields: Pick<
    TSignInAppFields,
    | 'saved'
    | 'clientSecret'
    | 'clientSecretReveal'
    | 'clientSecretRef'
    | 'replace'
  >;
};

export const ClientSecretField = ({ fields }: TClientSecretFieldProps) => {
  const t = useTranslations('signInAppsPage');
  const { saved, clientSecret, clientSecretReveal, clientSecretRef, replace } =
    fields;
  const { value, error, onChange } = clientSecret;
  const hasReplace = saved.hasOwnApp;
  const isSetShown = hasReplace && !replace.isOpen;
  const wasOpen = useRef(replace.isOpen);
  const { actions, wrapper, input } = clientSecretFieldVariants();

  useEffect(() => {
    if (replace.isOpen && !wasOpen.current) clientSecretRef.current?.focus();
    wasOpen.current = replace.isOpen;
  }, [replace.isOpen, clientSecretRef]);

  return (
    <FormField
      label={t('clientSecretLabel')}
      hint={t('clientSecretHint')}
      error={error}
      actions={
        hasReplace && (
          <span className={actions()}>
            {replace.isOpen && <UnsavedDot />}
            <Button
              variant={BUTTON_VARIANT.SECONDARY}
              size={SIZE.XS}
              onClick={() => replace.onOpenChange(!replace.isOpen)}
            >
              {t(replace.isOpen ? 'cancel' : 'replace')}
            </Button>
          </span>
        )
      }
    >
      <div className={wrapper()}>
        <TextInput
          ref={clientSecretRef}
          type={isSetShown || clientSecretReveal.isShown ? 'text' : 'password'}
          value={isSetShown ? t('secretSet') : value}
          onChange={onChange}
          isReadOnly={isSetShown}
          className={input({ isRevealable: !isSetShown })}
        />
        {!isSetShown && (
          <RevealToggle
            {...clientSecretReveal}
            showLabel={t('showClientSecret')}
            hideLabel={t('hideClientSecret')}
          />
        )}
      </div>
    </FormField>
  );
};
