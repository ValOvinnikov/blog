import { RemoveSubscriberControl } from '@platform/components/features/subscribers/remove-subscriber-control';
import { SubscribersPhoneList } from '@platform/components/features/subscribers/subscribers-phone-list';
import { DataTableShell } from '@platform/components/shared/data-table-shell';
import { Pagination } from '@platform/components/shared/pagination';
import { SUBSCRIBERS_PAGE_SIZE } from '@platform/constants/subscribers';
import type { TSubscribersPageData } from '@platform/server/subscribers/load-subscribers-page';
import { formatDate } from '@platform/utils/format-date/format-date';
import { adminRoutes } from '@platform/utils/routes/routes';
import { useLocale, useTranslations } from 'next-intl';
import { useId } from 'react';

import { subscribersListVariants } from './subscribers-list-variants';

const ACTIONS_COLUMN_WIDTH = '64px';

export type TSubscribersListProps = {
  tenantId: string;
  data: Pick<TSubscribersPageData, 'list' | 'page' | 'totalPages'>;
};

export const SubscribersList = ({ tenantId, data }: TSubscribersListProps) => {
  const t = useTranslations('subscribersPage.list');
  const locale = useLocale();
  const titleId = useId();
  const { list, page, totalPages } = data;
  const { rows, total } = list;
  const from = (page - 1) * SUBSCRIBERS_PAGE_SIZE + 1;
  const range = { from, to: from + rows.length - 1, count: total };
  const { wide, narrow, visuallyHidden, email, unavailable, date } =
    subscribersListVariants();

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
              label: (
                <span className={visuallyHidden()}>{t('columnActions')}</span>
              ),
              width: ACTIONS_COLUMN_WIDTH,
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
                  {formatDate(subscriber.confirmedAt, locale)}
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
              pageHref={adminRoutes.dashboardSubscribers}
              hasStatus={false}
            />
          </DataTableShell.Footer>
        </DataTableShell>
      </div>
      <div className={narrow()}>
        <SubscribersPhoneList
          tenantId={tenantId}
          rows={rows}
          range={range}
          pagination={{ page, totalPages }}
        />
      </div>
    </>
  );
};
