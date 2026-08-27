import { Card } from '@admin/components/shared/card';
import { DetailList } from '@admin/components/shared/detail-list';
import { StatusBadge } from '@admin/components/shared/status-badge';
import type { TTenant } from '@blog/db/schema/tenants';
import { useTranslations } from 'next-intl';

export type TContentWorkspaceCardProps = {
  tenant: TTenant;
};

export const ContentWorkspaceCard = ({
  tenant,
}: TContentWorkspaceCardProps) => {
  const t = useTranslations('tenantOverviewPage');
  const studioHost = `studio-${tenant.slug}.valstack.dev`;

  return (
    <Card>
      <Card.Header
        title={t('contentWorkspaceCardTitle')}
        headingLevel={2}
        actions={
          <StatusBadge tone="neutral" hasDot={false}>
            {t('platformBadge')}
          </StatusBadge>
        }
      />
      <Card.Body>
        <DetailList>
          <DetailList.Row label={t('sanityProjectLabel')} isMono={true}>
            {tenant.sanityProjectId ?? t('notSetValue')}
          </DetailList.Row>
          <DetailList.Row label={t('datasetLabel')} isMono={true}>
            {tenant.sanityDataset ?? t('notSetValue')}
          </DetailList.Row>
          <DetailList.Row label={t('studioLabel')} isMono={true}>
            {studioHost}
          </DetailList.Row>
          <DetailList.Row label={t('readTokenLabel')}>
            <StatusBadge
              tone={tenant.sanityReadTokenEncrypted ? 'ok' : 'neutral'}
            >
              {tenant.sanityReadTokenEncrypted
                ? t('readTokenStored')
                : t('readTokenNotSet')}
            </StatusBadge>
          </DetailList.Row>
          <DetailList.Row label={t('revalidateHookLabel')}>
            <StatusBadge tone={tenant.webhookCreatedAt ? 'ok' : 'neutral'}>
              {tenant.webhookCreatedAt
                ? t('revalidateHookActive')
                : t('revalidateHookNotSet')}
            </StatusBadge>
          </DetailList.Row>
        </DetailList>
      </Card.Body>
    </Card>
  );
};
