import { RemoveSubscriberControl } from '@platform/components/features/subscribers/remove-subscriber-control';
import { Card } from '@platform/components/shared/card';
import { Pagination } from '@platform/components/shared/pagination';
import { DAY_MONTH_SHORT_UTC } from '@platform/utils/date-format-options/date-format-options';
import { adminRoutes } from '@platform/utils/routes/routes';
import type { TConfirmedSubscriber } from '@shinefold/db/queries/subscribers/confirmed-subscribers';
import { useFormatter, useTranslations } from 'next-intl';

import { subscribersPhoneListVariants } from './subscribers-phone-list-variants';

export type TSubscribersRange = {
  from: number;
  to: number;
  count: number;
};

export type TSubscribersPhoneListProps = {
  tenantId: string;
  rows: TConfirmedSubscriber[];
  range: TSubscribersRange;
  pagination: { page: number; totalPages: number };
};

export const SubscribersPhoneList = ({
  tenantId,
  rows,
  range,
  pagination,
}: TSubscribersPhoneListProps) => {
  const t = useTranslations('subscribersPage.list');
  const format = useFormatter();
  const { list, row, text, email, unavailable, confirmed, footer } =
    subscribersPhoneListVariants();

  return (
    <Card>
      <Card.Header title={t('title')} />
      <ul className={list()}>
        {rows.map((subscriber) => (
          <li key={subscriber.id} className={row()}>
            <span className={text()}>
              {subscriber.email ? (
                <span className={email()}>{subscriber.email}</span>
              ) : (
                <span className={unavailable()}>{t('emailUnavailable')}</span>
              )}
              <span className={confirmed()}>
                {t('confirmedOn', {
                  date: format.dateTime(
                    subscriber.confirmedAt,
                    DAY_MONTH_SHORT_UTC,
                  ),
                })}
              </span>
            </span>
            <RemoveSubscriberControl
              tenantId={tenantId}
              subscriber={subscriber}
            />
          </li>
        ))}
      </ul>
      <div className={footer()}>
        <span>{t('showingShort', range)}</span>
        <Pagination
          {...pagination}
          pageHref={adminRoutes.dashboardSubscribers}
          hasStatus={false}
          isUnavailableStepHidden={true}
        />
      </div>
    </Card>
  );
};
