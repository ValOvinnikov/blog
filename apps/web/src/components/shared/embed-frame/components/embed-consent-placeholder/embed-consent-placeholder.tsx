'use client';

import {
  CONSENT_CATEGORY,
  type IWithClassName,
  type TEmbedProvider,
  type TMediaRatio,
} from '@blog/config';
import { ConsentPlaceholder } from '@blog/ui/components/molecules/consent-placeholder';
import { EMBED_PROVIDER_NAME } from '@web/constants/embed';
import { useConsentPreferences } from '@web/context/consent-preferences-provider';
import { useConsent } from '@web/hooks/use-consent';
import { useTranslations } from 'next-intl';

export interface IEmbedConsentPlaceholderProps extends IWithClassName {
  provider: TEmbedProvider;
  title: string;
  ratio: TMediaRatio;
}

export const EmbedConsentPlaceholder = ({
  provider,
  title,
  ratio,
  className,
}: IEmbedConsentPlaceholderProps) => {
  const t = useTranslations('consent');
  const { grant } = useConsent(CONSENT_CATEGORY.EXTERNAL_MEDIA);
  const { open } = useConsentPreferences();

  return (
    <ConsentPlaceholder
      providerName={EMBED_PROVIDER_NAME[provider]}
      message={title}
      allowLabel={t('placeholder.allowLabel')}
      settingsLabel={t('footerSettingsLabel')}
      scopeNote={t('placeholder.scopeNote')}
      ratio={ratio}
      onAllow={grant}
      onOpenSettings={open}
      className={className}
    />
  );
};
