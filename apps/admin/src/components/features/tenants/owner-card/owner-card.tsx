import { Card } from '@admin/components/shared/card';
import { DetailList } from '@admin/components/shared/detail-list';
import { StatusBadge } from '@admin/components/shared/status-badge';
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

  return (
    <Card>
      <Card.Header title={t('ownerCardTitle')} headingLevel={2} />
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
            <StatusBadge tone="neutral">{t('ownerRoleBadge')}</StatusBadge>
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
