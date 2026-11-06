import { StatusBadge } from '@platform/components/shared/status-badge';
import { useTranslations } from 'next-intl';

export type TSignInAppStatusBadgeProps = {
  hasOwnApp: boolean;
};

export const SignInAppStatusBadge = ({
  hasOwnApp,
}: TSignInAppStatusBadgeProps) => {
  const t = useTranslations('signInAppsPage');

  return (
    <StatusBadge tone={hasOwnApp ? 'brand' : 'neutral'} hasDot={false}>
      {t(hasOwnApp ? 'ownStatus' : 'sharedStatus')}
    </StatusBadge>
  );
};
