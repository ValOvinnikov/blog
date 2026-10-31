import { ALERT_TYPE, SIZE } from '@blog/config';
import { Alert } from '@platform/components/shared/alert';
import { LinkButton } from '@platform/components/shared/link-button';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { isContrastDue } from '@platform/server/releases/is-contrast-due';
import { adminRoutes } from '@platform/utils/routes/routes';
import { getTranslations } from 'next-intl/server';

export const ContrastDueBanner = async () => {
  const [isDue, t] = await Promise.all([
    isContrastDue(),
    getTranslations('contrastDueBanner'),
  ]);

  if (!isDue) return null;

  return (
    <Alert
      type={ALERT_TYPE.WARNING}
      title={t('title')}
      description={t('description')}
      action={
        <LinkButton
          href={adminRoutes.releases()}
          variant={BUTTON_VARIANT.SECONDARY}
          size={SIZE.SM}
        >
          {t('openReleases')}
        </LinkButton>
      }
    />
  );
};
