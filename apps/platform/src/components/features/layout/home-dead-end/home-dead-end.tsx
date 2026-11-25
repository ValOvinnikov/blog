import { DeadEndView } from '@platform/components/features/layout/dead-end-view';
import { LinkButton } from '@platform/components/shared/link-button';
import { BADGE_TONE } from '@platform/constants/badge-tone';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { getSessionEmail } from '@platform/server/auth/get-session-email';
import { resolveHomeHref } from '@platform/server/auth/resolve-home-href';
import { getTranslations } from 'next-intl/server';

export type THomeDeadEndProps = {
  badge: string;
  title: string;
  description: string;
};

export const HomeDeadEnd = async ({
  badge,
  title,
  description,
}: THomeDeadEndProps) => {
  const [t, homeHref, accountEmail] = await Promise.all([
    getTranslations('deadEndView'),
    resolveHomeHref(),
    getSessionEmail(),
  ]);

  return (
    <DeadEndView
      badge={{ label: badge, tone: BADGE_TONE.BRAND }}
      title={title}
      description={description}
      action={
        <LinkButton href={homeHref} variant={BUTTON_VARIANT.SECONDARY}>
          {t('backHome')}
        </LinkButton>
      }
      accountEmail={accountEmail}
    />
  );
};
