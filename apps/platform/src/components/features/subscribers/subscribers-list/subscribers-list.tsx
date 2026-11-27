import { RemoveSubscriberControl } from '@platform/components/features/subscribers/remove-subscriber-control';
import { SubscribersPhoneList } from '@platform/components/features/subscribers/subscribers-phone-list';
import { DataTableShell } from '@platform/components/shared/data-table-shell';
import { Pagination } from '@platform/components/shared/pagination';
import type { TSubscribersPageData } from '@platform/server/subscribers/load-subscribers-page';
import { DAY_MONTH_YEAR_SHORT_UTC } from '@platform/utils/date-format-options/date-format-options';
import { toSubscribersRange } from '@platform/utils/subscribers-range/subscribers-range';
import { useFormatter, useTranslations } from 'next-intl';
import { useId } from 'react';

import { subscribersListVariants } from './subscribers-list-variants';

export type TSubscribersListProps = {
  tenantId: string;
  data: Pick<TSubscribersPageData, 'list' | 'page' | 'pageHref' | 'totalPages'>;
};

export const SubscribersList = ({ tenantId, data }: TSubscribersListProps) => {
  const t = useTranslations('subscribersPage.list');
  const format = useFormatter();
  const titleId = useId();
  const { list, page, pageHref, totalPages } = data;
  const { rows } = list;
  const range = toSubscribersRange(data);
  const { wide, narrow, email, unavailable, date } = subscribersListVariants();

  return (
    <>
      <div className={wide()}>
        <DataTableShell
          items={rows}
          ariaLabel={t('title')}
          emptyMessage={t('title')}
          columns={[
            { key: 'email', label: t('columnEmail') },
            { key: 'confirmed', label: t('columnConfirmed') },
            {
              key: 'actions',
              label: t('columnActions'),
              isLabelHidden: true,
            },
          ]}
          renderRow={(subscriber) => (
            <DataTableShell.Row key={subscriber.id}>
              <DataTableShell.Cell>
                {subscriber.email ? (
                  <span className={email()}>{subscriber.email}</span>
                ) : (
                  <span className={unavailable()}>{t('emailUnavailable')}</span>
                )}
              </DataTableShell.Cell>
              <DataTableShell.Cell>
                <time
                  className={date()}
                  dateTime={subscriber.confirmedAt.toISOString()}
                >
                  {format.dateTime(
                    subscriber.confirmedAt,
                    DAY_MONTH_YEAR_SHORT_UTC,
                  )}
                </time>
              </DataTableShell.Cell>
              <DataTableShell.Cell>
                <RemoveSubscriberControl
                  tenantId={tenantId}
                  subscriber={subscriber}
                />
              </DataTableShell.Cell>
            </DataTableShell.Row>
          )}
        >
          <DataTableShell.Title id={titleId} count={t('order')}>
            {t('title')}
          </DataTableShell.Title>
          <DataTableShell.Footer>
            <span>{t('showing', range)}</span>
            <Pagination
              page={page}
              totalPages={totalPages}
              pageHref={pageHref}
              hasStatus={false}
            />
          </DataTableShell.Footer>
        </DataTableShell>
      </div>
      <div className={narrow()}>
        <SubscribersPhoneList tenantId={tenantId} data={data} />
      </div>
    </>
  );
};
