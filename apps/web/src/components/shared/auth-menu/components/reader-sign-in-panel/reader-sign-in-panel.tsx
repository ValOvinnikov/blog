'use client';

import type { TOAuthProviderId } from '@blog/auth/utils/oauth-providers/oauth-providers';
import {
  FORM_STATUS,
  ICONS,
  type IWithClassName,
  type TMaybeNull,
} from '@blog/config';
import { SignInPanel } from '@blog/ui/components/molecules/sign-in-panel';
import { useSignInAttempt } from '@web/components/shared/auth-menu/hooks/use-sign-in-attempt';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, type RefObject } from 'react';

export type TReaderSignInPanelProps = IWithClassName & {
  panelId: string;
  isOpen: boolean;
  panelRef: RefObject<TMaybeNull<HTMLDivElement>>;
  oauthProviderIds: readonly TOAuthProviderId[];
};

export const ReaderSignInPanel = ({
  panelId,
  isOpen,
  panelRef,
  oauthProviderIds,
  className,
}: TReaderSignInPanelProps) => {
  const t = useTranslations('authMenu');
  const {
    status,
    email,
    setEmail,
    isSendLimited,
    submitEmail,
    resetEmail,
    pendingProviderId,
    selectProvider,
  } = useSignInAttempt(isOpen);
  const isSent = status === FORM_STATUS.SUCCESS;
  const wasSent = useRef(isSent);

  useEffect(() => {
    const hadBeenSent = wasSent.current;
    wasSent.current = isSent;
    if (!isOpen || isSent === hadBeenSent) return;

    const target = isSent ? 'button' : 'input';
    panelRef.current?.querySelector<HTMLElement>(target)?.focus();
  }, [isSent, isOpen, panelRef]);

  const allProviders = [
    {
      id: 'github',
      icon: ICONS.GITHUB,
      label: t('continueWithGithub'),
      pendingLabel: t('continuingWithGithub'),
    },
    {
      id: 'google',
      icon: ICONS.GOOGLE,
      label: t('continueWithGoogle'),
      pendingLabel: t('continuingWithGoogle'),
    },
  ] as const;
  const providers = allProviders
    .filter(({ id }) => oauthProviderIds.includes(id))
    .map((provider) => ({
      ...provider,
      onSelect: () => selectProvider(provider.id),
    }));

  return (
    <SignInPanel
      ref={panelRef}
      panel={{ id: panelId, isOpen }}
      className={className}
      providers={providers}
      pendingProviderId={pendingProviderId}
      labels={{
        title: t('signInHeading'),
        or: t('or'),
        hint: t('redirectHint'),
        email: t('emailAriaLabel'),
        emailPlaceholder: t('emailPlaceholder'),
        submit: t('sendSignInLink'),
        sending: t('sending'),
        sentTitle: t('sentTitle'),
        sentMessage: t.rich('sentMessage', {
          email,
          strong: (chunks) => <strong>{chunks}</strong>,
        }),
        useDifferentEmail: t('useDifferentEmail'),
      }}
      emailForm={{
        value: email,
        onChange: setEmail,
        onSubmit: () => void submitEmail(),
        onReset: resetEmail,
        status,
        errorMessage: isSendLimited ? t('sendLimited') : t('emailError'),
      }}
    />
  );
};
