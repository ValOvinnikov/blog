import {
  CONSENT_CATEGORY,
  PORTABLE_TEXT_BLOCK_TYPE,
  type TConsentCategory,
} from '@blog/config';
import { InlineCode } from '@blog/ui/components/atoms/inline-code';
import { Table } from '@blog/ui/components/molecules/table';
import {
  COOKIE_LIST,
  COOKIE_PROVIDER,
  type TCookieProvider,
} from '@web/constants/cookie-list';
import { useTranslations } from 'next-intl';

const CATEGORY_LABEL_KEY: Record<TConsentCategory, string> = {
  [CONSENT_CATEGORY.NECESSARY]: 'categories.necessary.label',
  [CONSENT_CATEGORY.EXTERNAL_MEDIA]: 'categories.externalMedia.label',
};

const PROVIDER_LABEL_KEY: Record<TCookieProvider, string> = {
  [COOKIE_PROVIDER.FIRST_PARTY]: 'providers.site',
};

export const CookieList = () => {
  const t = useTranslations(PORTABLE_TEXT_BLOCK_TYPE.COOKIE_LIST);
  const tConsent = useTranslations('consent');

  return (
    <>
      <Table ariaLabel={t('ariaLabel')}>
        <Table.Head>
          <Table.Row>
            <Table.HeaderCell>{t('columns.name')}</Table.HeaderCell>
            <Table.HeaderCell>{t('columns.provider')}</Table.HeaderCell>
            <Table.HeaderCell>{t('columns.purpose')}</Table.HeaderCell>
            <Table.HeaderCell>{t('columns.duration')}</Table.HeaderCell>
            <Table.HeaderCell>{t('columns.category')}</Table.HeaderCell>
          </Table.Row>
        </Table.Head>
        {COOKIE_LIST.map(({ id, name, provider, category }) => (
          <Table.Row key={name}>
            <Table.HeaderCell isRowHeader={true}>
              <InlineCode>{name}</InlineCode>
            </Table.HeaderCell>
            <Table.Cell>{t(PROVIDER_LABEL_KEY[provider])}</Table.Cell>
            <Table.Cell>{t(`cookies.${id}.purpose`)}</Table.Cell>
            <Table.Cell>{t(`cookies.${id}.duration`)}</Table.Cell>
            <Table.Cell>{tConsent(CATEGORY_LABEL_KEY[category])}</Table.Cell>
          </Table.Row>
        ))}
      </Table>
      <p>{t('analyticsNote')}</p>
    </>
  );
};
