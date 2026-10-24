import { SIZE } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { buttonVariants } from '@platform/components/shared/button/button-variants';
import { Card } from '@platform/components/shared/card';
import { DetailList } from '@platform/components/shared/detail-list';
import { Text } from '@platform/components/shared/text';
import type { TInboxLead } from '@platform/server/leads/to-inbox-lead';
import { formatDateTime } from '@platform/utils/format-date-time/format-date-time';
import { useLocale, useTranslations } from 'next-intl';

import { DeleteLeadControl } from './components/delete-lead-control';
import { LeadPageSource } from './components/lead-page-source';
import { leadReadingPaneVariants } from './lead-reading-pane-variants';

export type TLeadReadingPaneProps = {
  lead: TInboxLead;
  onBack: () => void;
  onMarkUnread: (lead: TInboxLead) => void;
  onDeleted: (leadId: string) => void;
};

export const LeadReadingPane = ({
  lead,
  onBack,
  onMarkUnread,
  onDeleted,
}: TLeadReadingPaneProps) => {
  const t = useTranslations('leadsInbox');
  const locale = useLocale();
  const { id, name, email, message, createdAt } = lead;
  const styles = leadReadingPaneVariants();
  const mailto = `mailto:${email}`;

  return (
    <div className={styles.root()}>
      <Button
        size={SIZE.SM}
        variant="secondary"
        className={styles.back()}
        onClick={onBack}
      >
        {t('back')}
      </Button>
      <Card className={styles.card()}>
        <Card.Header
          title={<span className={styles.name()}>{name}</span>}
          actions={
            <>
              <a
                href={mailto}
                className={buttonVariants({
                  size: SIZE.SM,
                  variant: 'primary',
                }).root()}
              >
                {t('reply')}
              </a>
              <Button
                size={SIZE.SM}
                variant="secondary"
                onClick={() => onMarkUnread(lead)}
              >
                {t('markUnread')}
              </Button>
              <DeleteLeadControl
                leadId={id}
                leadName={name}
                onDeleted={onDeleted}
              />
            </>
          }
        />
        <Card.Body className={styles.body()}>
          <DetailList>
            <DetailList.Row label={t('email')}>
              <a className={styles.email()} href={mailto}>
                {email}
              </a>
            </DetailList.Row>
            <DetailList.Row label={t('received')}>
              <time dateTime={createdAt.toISOString()}>
                {formatDateTime(createdAt.toISOString(), locale)}
              </time>
            </DetailList.Row>
            <DetailList.Row label={t('page')}>
              <LeadPageSource lead={lead} />
            </DetailList.Row>
          </DetailList>
          <Text className={styles.message()}>{message}</Text>
        </Card.Body>
      </Card>
    </div>
  );
};
