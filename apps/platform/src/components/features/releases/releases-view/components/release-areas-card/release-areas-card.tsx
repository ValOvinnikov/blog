import { RELEASE_CHANGE, type TReleaseChange } from '@blog/config';
import { Card } from '@platform/components/shared/card';
import { DetailList } from '@platform/components/shared/detail-list';
import { StatusBadge } from '@platform/components/shared/status-badge';
import { Text } from '@platform/components/shared/text';
import type { TReleaseChanges } from '@platform/server/releases/classify-release-changes';
import type { TReleaseMigrationSummary } from '@platform/server/releases/summarise-release-migrations';
import { useTranslations } from 'next-intl';

export type TReleaseAreasCardProps = {
  changes: TReleaseChanges;
  migrations: TReleaseMigrationSummary;
};

export const ReleaseAreasCard = ({
  changes,
  migrations,
}: TReleaseAreasCardProps) => {
  const t = useTranslations('releaseAreasCard');
  const { contentMigrations, tenants, dbMigrations, isLowerBound } = migrations;

  const migrationNote = (area: TReleaseChange) => {
    if (area === RELEASE_CHANGE.DB_MIGRATION) {
      return t(isLowerBound ? 'dbMigrationsMinimum' : 'dbMigrations', {
        count: dbMigrations,
      });
    }
    if (area === RELEASE_CHANGE.SANITY_MIGRATION) {
      return t(isLowerBound ? 'sanityMigrationsMinimum' : 'sanityMigrations', {
        count: contentMigrations,
        tenants,
      });
    }
    return undefined;
  };

  return (
    <Card>
      <Card.Header title={t('title')} supportingText={t('description')} />
      <Card.Body>
        <DetailList>
          {Object.values(RELEASE_CHANGE).map((area) => {
            const isTouched = changes[area];
            const note = isTouched ? migrationNote(area) : undefined;

            return (
              <DetailList.Row key={area} label={t(`area.${area}`)}>
                <StatusBadge tone={isTouched ? 'warn' : 'neutral'}>
                  {isTouched ? t('touched') : t('untouched')}
                </StatusBadge>
                {note && (
                  <Text as="span" variant="muted">
                    {note}
                  </Text>
                )}
              </DetailList.Row>
            );
          })}
        </DetailList>
      </Card.Body>
    </Card>
  );
};
