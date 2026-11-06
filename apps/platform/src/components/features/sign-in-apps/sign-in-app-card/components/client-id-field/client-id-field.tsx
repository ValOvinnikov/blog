'use client';

import { RevealToggle } from '@platform/components/features/sign-in-apps/reveal-toggle';
import type { TSignInAppFields } from '@platform/components/features/sign-in-apps/sign-in-app-card/use-sign-in-app-fields';
import { FormField } from '@platform/components/shared/form-field';
import { TextInput } from '@platform/components/shared/text-input';
import { maskClientId } from '@platform/utils/mask-client-id/mask-client-id';
import { useTranslations } from 'next-intl';

import { clientIdFieldVariants } from './client-id-field-variants';

export type TClientIdFieldProps = {
  providerName: string;
  fields: Pick<
    TSignInAppFields,
    'saved' | 'clientId' | 'clientIdReveal' | 'clientIdRef'
  >;
};

export const ClientIdField = ({
  providerName,
  fields,
}: TClientIdFieldProps) => {
  const t = useTranslations('signInAppsPage');
  const { saved, clientId, clientIdReveal, clientIdRef } = fields;
  const { value, error, onChange } = clientId;
  const isRevealable = saved.hasOwnApp;
  const isMasked = isRevealable && !clientIdReveal.isShown;
  const { wrapper, input } = clientIdFieldVariants({ isRevealable, isMasked });

  return (
    <FormField
      label={t('clientIdLabel')}
      hint={t('clientIdHint', { provider: providerName })}
      error={error}
    >
      <div className={wrapper()}>
        <TextInput
          ref={clientIdRef}
          value={isMasked ? maskClientId(value) : value}
          onChange={onChange}
          isReadOnly={isMasked}
          className={input()}
        />
        {isRevealable && (
          <RevealToggle
            {...clientIdReveal}
            showLabel={t('showClientId')}
            hideLabel={t('hideClientId')}
          />
        )}
      </div>
    </FormField>
  );
};
