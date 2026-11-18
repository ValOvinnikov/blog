'use client';

import { CONSENT_CATEGORY, PORTABLE_TEXT_BLOCK_TYPE } from '@shinefold/config';
import { ANALYTICS_PROVIDER } from '@shinefold/config/constants';
import { InlineCode } from '@shinefold/ui/components/atoms/inline-code';
import { Table } from '@shinefold/ui/components/molecules/table';
import { useSiteAnalytics } from '@web/context/site-analytics-provider';
import { toCookieList } from '@web/utils/to-cookie-list';
import { useTranslations } from 'next-intl';

import { cookieListVariants } from './cookie-list-variants';
import { FULL_BLEED_DATA_ATTR } from './full-bleed';

const s = cookieListVariants();

export const CookieList = () => {
  const t = useTranslations(PORTABLE_TEXT_BLOCK_TYPE.COOKIE_LIST);
  const ariaLabel = t('ariaLabel');
  const purposeLabel = t('columns.purpose');
  const durationLabel = t('columns.duration');
  const analytics = useSiteAnalytics();
  const cookieList = toCookieList(analytics);
  const isOnPlausible = analytics?.provider === ANALYTICS_PROVIDER.PLAUSIBLE;
  const isAllNecessary = cookieList.every(
    ({ category }) => category === CONSENT_CATEGORY.NECESSARY,
  );

  return (
    <>
      <p>{t(isAllNecessary ? 'intro' : 'introWithGoogleAnalytics')}</p>
      <ul aria-label={ariaLabel} className={s.stack()}>
        {cookieList.map(({ id, name }) => (
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
      <div {...{ [FULL_BLEED_DATA_ATTR]: '' }} className={s.table()}>
        <Table ariaLabel={ariaLabel}>
          <Table.Head>
            <Table.Row>
              <Table.HeaderCell>{t('columns.name')}</Table.HeaderCell>
              <Table.HeaderCell>{purposeLabel}</Table.HeaderCell>
              <Table.HeaderCell>{durationLabel}</Table.HeaderCell>
            </Table.Row>
          </Table.Head>
          {cookieList.map(({ id, name }) => (
            <Table.Row key={name}>
              <Table.HeaderCell isRowHeader={true}>
                <InlineCode>{name}</InlineCode>
              </Table.HeaderCell>
              <Table.Cell>{t(`cookies.${id}.purpose`)}</Table.Cell>
              <Table.Cell>{t(`cookies.${id}.duration`)}</Table.Cell>
            </Table.Row>
          ))}
        </Table>
      </div>
      <p>{t('analyticsNote')}</p>
      {isOnPlausible && <p>{t('plausibleNote')}</p>}
    </>
  );
};
