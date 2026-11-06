import { SignInAppStatusBadge } from '@platform/components/features/sign-in-apps/sign-in-app-status-badge';
import { SignInAppTitle } from '@platform/components/features/sign-in-apps/sign-in-app-title';
import { Card } from '@platform/components/shared/card';
import { GrowthBadge } from '@platform/components/shared/growth-badge';
import { Text } from '@platform/components/shared/text';
import type { TSignInAppView } from '@platform/server/sign-in-apps/load-sign-in-apps';
import { useTranslations } from 'next-intl';

import { signInAppsFreeCardVariants } from './sign-in-apps-free-card-variants';

export type TSignInAppsFreeCardProps = {
  apps: TSignInAppView[];
};

export const SignInAppsFreeCard = ({ apps }: TSignInAppsFreeCardProps) => {
  const t = useTranslations('signInAppsPage');
  const { list, row, name, badges } = signInAppsFreeCardVariants();

  return (
    <Card>
      <ul className={list()}>
        {apps.map(({ provider, hasKeptApp }) => (
          <li key={provider} className={row()}>
            <div className={name()}>
              <SignInAppTitle provider={provider} />
              {hasKeptApp && <Text variant="muted">{t('keptOnGrowth')}</Text>}
            </div>
            <div className={badges()}>
              <GrowthBadge />
              <SignInAppStatusBadge hasOwnApp={false} />
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
};
