import { StatusBadge } from '@platform/components/shared/status-badge';
import { BADGE_TONE } from '@platform/constants/badge-tone';
import { formatDate } from '@platform/utils/format-date/format-date';
import type { TMaybeNull } from '@shinefold/config';
import { isNull } from '@shinefold/utils/primitives';
import { useLocale, useTranslations } from 'next-intl';

export type TGrantedBadgeProps = {
  expiresAt: TMaybeNull<Date>;
};

export const GrantedBadge = ({ expiresAt }: TGrantedBadgeProps) => {
  const t = useTranslations('grantedBadge');
  const locale = useLocale();

  return (
    <StatusBadge tone={BADGE_TONE.OK} hasDot={false}>
      {isNull(expiresAt)
        ? t('label')
        : t('labelUntil', { date: formatDate(expiresAt, locale) })}
    </StatusBadge>
  );
};
