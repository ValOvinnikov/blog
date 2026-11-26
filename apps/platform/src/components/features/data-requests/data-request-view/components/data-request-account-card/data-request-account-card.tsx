import { Card } from '@platform/components/shared/card';
import { DetailList } from '@platform/components/shared/detail-list';
import type { TPersonalDataReaderAccount } from '@shinefold/db/queries/personal-data/reader-account-personal-data';
import { hasLength } from '@shinefold/utils/primitives';
import { useFormatter, useTranslations } from 'next-intl';
import { keys } from 'remeda';

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
  const providerNames = keys(linkedProviders)
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
            {hasLength(providerNames)
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
