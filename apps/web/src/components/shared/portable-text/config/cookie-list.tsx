import { PORTABLE_TEXT_BLOCK_TYPE } from '@blog/config';
import { InlineCode } from '@blog/ui/components/atoms/inline-code';
import { Table } from '@blog/ui/components/molecules/table';
import { COOKIE_LIST } from '@web/constants/cookie-list';
import { useTranslations } from 'next-intl';

import { cookieListVariants } from './cookie-list-variants';

const s = cookieListVariants();

export const CookieList = () => {
  const t = useTranslations(PORTABLE_TEXT_BLOCK_TYPE.COOKIE_LIST);
  const ariaLabel = t('ariaLabel');
  const purposeLabel = t('columns.purpose');
  const durationLabel = t('columns.duration');

  return (
    <>
      <p>{t('intro')}</p>
      <ul aria-label={ariaLabel} className={s.stack()}>
        {COOKIE_LIST.map(({ id, name }) => (
          <li key={name} className={s.entry()}>
            <InlineCode>{name}</InlineCode>
            <dl>
              <dt className={s.term()}>{purposeLabel}</dt>
              <dd>{t(`cookies.${id}.purpose`)}</dd>
              <dt className={s.term()}>{durationLabel}</dt>
              <dd>{t(`cookies.${id}.duration`)}</dd>
            </dl>
          </li>
        ))}
      </ul>
      <Table ariaLabel={ariaLabel} className={s.table()}>
        <Table.Head>
          <Table.Row>
            <Table.HeaderCell>{t('columns.name')}</Table.HeaderCell>
            <Table.HeaderCell>{purposeLabel}</Table.HeaderCell>
            <Table.HeaderCell>{durationLabel}</Table.HeaderCell>
          </Table.Row>
        </Table.Head>
        {COOKIE_LIST.map(({ id, name }) => (
          <Table.Row key={name}>
            <Table.HeaderCell isRowHeader={true}>
              <InlineCode>{name}</InlineCode>
            </Table.HeaderCell>
            <Table.Cell>{t(`cookies.${id}.purpose`)}</Table.Cell>
            <Table.Cell>{t(`cookies.${id}.duration`)}</Table.Cell>
          </Table.Row>
        ))}
      </Table>
      <p>{t('analyticsNote')}</p>
    </>
  );
};
