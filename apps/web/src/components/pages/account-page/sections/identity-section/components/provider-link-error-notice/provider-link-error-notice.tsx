'use client';

import { identitySectionVariants } from '@web/components/pages/account-page/sections/identity-section/identity-section-variants';
import { AUTH_ERROR_TYPE } from '@web/constants/sign-in';
import { useOAuthErrorParam } from '@web/hooks/use-oauth-error-param';
import { useTranslations } from 'next-intl';

const s = identitySectionVariants();

export const ProviderLinkErrorNotice = () => {
  const linkError = useOAuthErrorParam();
  const t = useTranslations('accountPage.identity');

  if (!linkError) return null;

  return (
    <p role="alert" className={s.linkError()}>
      {linkError === AUTH_ERROR_TYPE.OAUTH_ACCOUNT_NOT_LINKED
        ? t('linkNotLinkedError')
        : t('linkError')}
    </p>
  );
};
