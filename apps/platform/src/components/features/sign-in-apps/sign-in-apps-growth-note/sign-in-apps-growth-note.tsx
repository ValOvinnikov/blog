import { OAUTH_PROVIDER } from '@blog/config/constants';
import { GrowthNote } from '@platform/components/shared/growth-note';
import { useTranslations } from 'next-intl';

export const SignInAppsGrowthNote = () => {
  const t = useTranslations('signInAppsPage');

  return (
    <GrowthNote
      items={[
        { id: OAUTH_PROVIDER.GOOGLE, label: t('growthAddsGoogle') },
        { id: OAUTH_PROVIDER.GITHUB, label: t('growthAddsGithub') },
      ]}
    />
  );
};
