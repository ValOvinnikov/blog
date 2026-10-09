import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import { Card } from '@platform/components/shared/card';
import { DetailList } from '@platform/components/shared/detail-list';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { useTranslations } from 'next-intl';

export type TOwnerCardProps = {
  ownerEmail: string | undefined;
  ownerJoinedAt: string | undefined;
  ownerJoinedAtIso: string | undefined;
};

export const OwnerCard = ({
  ownerEmail,
  ownerJoinedAt,
  ownerJoinedAtIso,
}: TOwnerCardProps) => {
  const t = useTranslations('tenantOverviewPage');
  const tRole = useTranslations('roleLabel');

  return (
    <Card>
      <Card.Header title={t('ownerCardTitle')} />
      <Card.Body>
        <DetailList>
          <DetailList.Row
            label={t('emailLabel')}
            isMono={true}
            action={
              !ownerEmail && (
                <StatusBadge tone="warn">
                  {t('ownerInvitedPendingBadge')}
                </StatusBadge>
              )
            }
          >
            {ownerEmail ?? '—'}
          </DetailList.Row>
          <DetailList.Row label={t('roleLabel')}>
            <StatusBadge tone="neutral">
              {tRole(MEMBERSHIP_ROLE.OWNER)}
            </StatusBadge>
          </DetailList.Row>
          {ownerJoinedAt && ownerJoinedAtIso && (
            <DetailList.Row label={t('joinedLabel')}>
              <time dateTime={ownerJoinedAtIso}>{ownerJoinedAt}</time>
            </DetailList.Row>
          )}
        </DetailList>
      </Card.Body>
    </Card>
  );
};
