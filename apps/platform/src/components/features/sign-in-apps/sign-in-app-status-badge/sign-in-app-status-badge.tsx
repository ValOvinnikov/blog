import { StatusBadge } from '@platform/components/shared/status-badge';
import { BADGE_TONE } from '@platform/constants/badge-tone';
import { useTranslations } from 'next-intl';

export type TSignInAppStatusBadgeProps = {
  hasOwnApp: boolean;
};

export const SignInAppStatusBadge = ({
  hasOwnApp,
}: TSignInAppStatusBadgeProps) => {
  const t = useTranslations('signInAppsPage');

  return (
    <StatusBadge
      tone={hasOwnApp ? BADGE_TONE.BRAND : BADGE_TONE.NEUTRAL}
      hasDot={false}
    >
      {t(hasOwnApp ? 'ownStatus' : 'sharedStatus')}
    </StatusBadge>
  );
};
