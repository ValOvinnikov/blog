import { RemoveSubscriberControl } from '@platform/components/features/subscribers/remove-subscriber-control';
import { Card } from '@platform/components/shared/card';
import { Pagination } from '@platform/components/shared/pagination';
import type { TSubscribersPageData } from '@platform/server/subscribers/load-subscribers-page';
import { DAY_MONTH_SHORT_UTC } from '@platform/utils/date-format-options/date-format-options';
import { toSubscribersRange } from '@platform/utils/subscribers-range/subscribers-range';
import { useFormatter, useTranslations } from 'next-intl';

import { subscribersPhoneListVariants } from './subscribers-phone-list-variants';

export type TSubscribersPhoneListProps = {
  tenantId: string;
  data: Pick<TSubscribersPageData, 'list' | 'page' | 'pageHref' | 'totalPages'>;
};

export const SubscribersPhoneList = ({
  tenantId,
  data,
}: TSubscribersPhoneListProps) => {
  const t = useTranslations('subscribersPage.list');
  const format = useFormatter();
  const { list, page, pageHref, totalPages } = data;
  const {
    list: listSlot,
    row,
    text,
    email,
    unavailable,
    confirmed,
    footer,
  } = subscribersPhoneListVariants();

  return (
    <Card>
      <Card.Header title={t('title')} />
      <ul className={listSlot()}>
        {list.rows.map((subscriber) => (
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
        <span>{t('showingShort', toSubscribersRange(data))}</span>
        <Pagination
          page={page}
          totalPages={totalPages}
          pageHref={pageHref}
          hasStatus={false}
          isUnavailableStepHidden={true}
        />
      </div>
    </Card>
  );
};
