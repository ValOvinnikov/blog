import type { TMaybeUndefined } from '@blog/config';
import { MEMBERSHIP_ROLE } from '@blog/db/constants';
import type { TTenantOwnerMembership } from '@blog/db/queries/memberships';
import { Card } from '@platform/components/shared/card';
import { DetailList } from '@platform/components/shared/detail-list';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { formatDate } from '@platform/utils/format-date/format-date';
import { useLocale, useTranslations } from 'next-intl';

export type TOwnerCardProps = {
  owner: TMaybeUndefined<TTenantOwnerMembership>;
};

export const OwnerCard = ({ owner }: TOwnerCardProps) => {
  const t = useTranslations('tenantOverviewPage');
  const tRole = useTranslations('roleLabel');
  const locale = useLocale();
  const ownerEmail = owner?.email;
  const joinedAt = owner?.joinedAt;

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
          {joinedAt && (
            <DetailList.Row label={t('joinedLabel')}>
              <time dateTime={joinedAt.toISOString()}>
                {formatDate(joinedAt, locale)}
              </time>
            </DetailList.Row>
          )}
        </DetailList>
      </Card.Body>
    </Card>
  );
};
