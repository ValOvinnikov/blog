import { Button } from '@platform/components/shared/button';
import type { TInboxLead } from '@platform/server/leads/to-inbox-lead';
import { formatShortDateTime } from '@platform/utils/format-short-date-time/format-short-date-time';
import { useLocale, useNow, useTranslations } from 'next-intl';

import { leadRowVariants } from './lead-row-variants';

export type TLeadRowProps = {
  lead: TInboxLead;
  isSelected: boolean;
  onOpen: (lead: TInboxLead) => void;
};

export const LeadRow = ({ lead, isSelected, onOpen }: TLeadRowProps) => {
  const t = useTranslations('leadsInbox');
  const locale = useLocale();
  const now = useNow();
  const { name, message, isRead, createdAt } = lead;
  const styles = leadRowVariants({ isRead, isSelected });

  return (
    <Button
      variant="unstyled"
      className={styles.row()}
      aria-current={isSelected ? 'true' : undefined}
      onClick={() => onOpen(lead)}
    >
      <span className={styles.top()}>
        {!isRead && (
          <>
            <span className={styles.dot()} aria-hidden="true" />
            <span className={styles.srOnly()}>{t('unread')}</span>
          </>
        )}
        <span className={styles.name()}>{name}</span>
        <time className={styles.time()} dateTime={createdAt.toISOString()}>
          {formatShortDateTime({
            date: createdAt,
            now,
            locale,
            yesterdayLabel: t('yesterday'),
          })}
        </time>
      </span>
      <span className={styles.preview()}>{message}</span>
    </Button>
  );
};
