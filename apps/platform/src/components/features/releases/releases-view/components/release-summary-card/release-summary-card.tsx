import { Card } from '@platform/components/shared/card';
import { DetailList } from '@platform/components/shared/detail-list';
import { shortSha } from '@platform/utils/short-sha/short-sha';
import { useTranslations } from 'next-intl';

export type TReleaseSummaryCardProps = {
  lastTag: string;
  headSha: string;
  totalCommits: number;
};

export const ReleaseSummaryCard = ({
  lastTag,
  headSha,
  totalCommits,
}: TReleaseSummaryCardProps) => {
  const t = useTranslations('releaseSummaryCard');

  return (
    <Card>
      <Card.Header title={t('title')} supportingText={t('description')} />
      <Card.Body>
        <DetailList>
          <DetailList.Row label={t('lastTag')} isMono={true}>
            {lastTag}
          </DetailList.Row>
          <DetailList.Row label={t('headCommit')} isMono={true}>
            {shortSha(headSha)}
          </DetailList.Row>
          <DetailList.Row label={t('commitsSinceTag')}>
            {t('commitCount', { count: totalCommits })}
          </DetailList.Row>
        </DetailList>
      </Card.Body>
    </Card>
  );
};
