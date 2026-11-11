'use client';

import type { IWithClassName, TEmbedProvider, TMediaRatio } from '@blog/config';
import { ConsentPlaceholder } from '@blog/ui/components/molecules/consent-placeholder';
import { EMBED_PROVIDER_NAME } from '@web/constants/embed';
import { useConsentPreferences } from '@web/context/consent-preferences-provider';
import { useTranslations } from 'next-intl';

export interface IEmbedConsentPlaceholderProps extends IWithClassName {
  provider: TEmbedProvider;
  title: string;
  ratio: TMediaRatio;
  onAllow: () => void;
}

export const EmbedConsentPlaceholder = ({
  provider,
  title,
  ratio,
  onAllow,
  className,
}: IEmbedConsentPlaceholderProps) => {
  const t = useTranslations('consent');
  const { open } = useConsentPreferences();

  return (
    <ConsentPlaceholder
      providerName={EMBED_PROVIDER_NAME[provider]}
      message={title}
      allowLabel={t('placeholder.allowLabel')}
      settingsLabel={t('footerSettingsLabel')}
      scopeNote={t('placeholder.scopeNote')}
      ratio={ratio}
      onAllow={onAllow}
      onOpenSettings={open}
      className={className}
    />
  );
};
