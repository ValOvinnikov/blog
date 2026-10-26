import type { TPersonalDataReaderAccount } from '@blog/db/queries/personal-data/reader-account-personal-data';
import { objectKeys } from '@blog/utils/primitives';
import { Card } from '@platform/components/shared/card';
import { DetailList } from '@platform/components/shared/detail-list';
import { useFormatter, useTranslations } from 'next-intl';

export type TDataRequestAccountCardProps = {
  readerAccount: TPersonalDataReaderAccount;
};

export const DataRequestAccountCard = ({
  readerAccount,
}: TDataRequestAccountCardProps) => {
  const t = useTranslations('dataRequestAccountCard');
  const tProvider = useTranslations('dataRequestAccountCard.provider');
  const format = useFormatter();
  const { name, email, linkedProviders, activeSessionCount, bookmarks } =
    readerAccount;
  const providerNames = objectKeys(linkedProviders)
    .filter((provider) => linkedProviders[provider])
    .map((provider) => tProvider(provider));

  return (
    <Card>
      <Card.Header title={t('title')} supportingText={t('supportingText')} />
      <Card.Body>
        <DetailList>
          <DetailList.Row label={t('name')}>
            {name ?? t('noName')}
          </DetailList.Row>
          <DetailList.Row label={t('email')}>{email}</DetailList.Row>
          <DetailList.Row label={t('providers')}>
            {providerNames.length > 0
              ? format.list(providerNames)
              : t('noProviders')}
          </DetailList.Row>
          <DetailList.Row label={t('activeSessions')}>
            {t('sessionCount', { count: activeSessionCount })}
          </DetailList.Row>
          <DetailList.Row label={t('bookmarks')}>
            {t('bookmarkCount', { count: bookmarks.length })}
          </DetailList.Row>
        </DetailList>
      </Card.Body>
    </Card>
  );
};
