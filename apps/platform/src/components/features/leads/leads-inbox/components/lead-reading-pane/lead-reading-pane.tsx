import { SIZE, type TMaybeNull } from '@blog/config';
import { Button } from '@platform/components/shared/button';
import { buttonVariants } from '@platform/components/shared/button/button-variants';
import { Card } from '@platform/components/shared/card';
import { DetailList } from '@platform/components/shared/detail-list';
import { Text } from '@platform/components/shared/text';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import type { TInboxLead } from '@platform/server/leads/to-inbox-lead';
import { formatDateTime } from '@platform/utils/format-date-time/format-date-time';
import { useLocale, useTranslations } from 'next-intl';
import type { RefObject } from 'react';

import { DeleteLeadControl } from './components/delete-lead-control';
import { LeadPageSource } from './components/lead-page-source';
import { leadReadingPaneVariants } from './lead-reading-pane-variants';

export type TLeadReadingPaneProps = {
  lead: TInboxLead;
  headingRef: RefObject<TMaybeNull<HTMLSpanElement>>;
  onBack: () => void;
  onMarkUnread: (lead: TInboxLead) => void;
  onDeleted: (leadId: string) => void;
};

export const LeadReadingPane = ({
  lead,
  headingRef,
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
        variant={BUTTON_VARIANT.SECONDARY}
        focusGround={FOCUS_RING_GROUND.BG}
        className={styles.back()}
        onClick={onBack}
      >
        {t('back')}
      </Button>
      <Card className={styles.card()}>
        <Card.Header
          title={
            <span ref={headingRef} tabIndex={-1} className={styles.name()}>
              {name}
            </span>
          }
          actions={
            <>
              <a
                href={mailto}
                className={buttonVariants({
                  size: SIZE.SM,
                  variant: BUTTON_VARIANT.PRIMARY,
                  focusGround: FOCUS_RING_GROUND.SURFACE_HEAD,
                }).root()}
              >
                {t('reply')}
              </a>
              <Button
                size={SIZE.SM}
                variant={BUTTON_VARIANT.SECONDARY}
                focusGround={FOCUS_RING_GROUND.SURFACE_HEAD}
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
