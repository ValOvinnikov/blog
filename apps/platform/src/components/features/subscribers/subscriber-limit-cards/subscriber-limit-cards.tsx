import {
  LimitCard,
  type TLimitCardCopy,
} from '@platform/components/features/subscribers/limit-card';
import { SUBSCRIBER_LIMIT_STATE } from '@platform/constants/subscribers';
import type { TSubscribersPageData } from '@platform/server/subscribers/load-subscribers-page';
import {
  DAY_MONTH_LONG_UTC,
  DAY_MONTH_SHORT_UTC,
} from '@platform/utils/date-format-options/date-format-options';
import { utcNextMonthStart } from '@shinefold/utils/date';
import { isUndefined } from '@shinefold/utils/primitives';
import { useFormatter, useTranslations } from 'next-intl';
import { useId } from 'react';

import { subscriberLimitCardsVariants } from './subscriber-limit-cards-variants';

export type TSubscriberLimitCardsProps = {
  data: Pick<TSubscribersPageData, 'band' | 'emails' | 'nextBand'>;
  isEmpty: boolean;
};

export const SubscriberLimitCards = ({
  data,
  isEmpty,
}: TSubscriberLimitCardsProps) => {
  const t = useTranslations('subscribersPage');
  const format = useFormatter();
  const headingId = useId();
  const { band, emails, nextBand } = data;
  const resetsAt = utcNextMonthStart(new Date());
  const { root, heading } = subscriberLimitCardsVariants();

  const bandNote = () => {
    const { state, left, percent, over } = band;
    if (state === SUBSCRIBER_LIMIT_STATE.PAUSED) {
      return t('band.notes.PAUSED', { over });
    }
    if (state === SUBSCRIBER_LIMIT_STATE.NEAR) {
      return t('band.notes.NEAR', { percent, left });
    }
    return isUndefined(nextBand)
      ? t('band.notes.UNDER_LARGEST', { left })
      : t('band.notes.UNDER', { left, next: nextBand });
  };
  const emailsNote = () => {
    const { state, left, percent, postNeeds, postsLeft } = emails;
    if (state === SUBSCRIBER_LIMIT_STATE.PAUSED) {
      return t('emails.notes.PAUSED', { count: postNeeds });
    }
    if (state === SUBSCRIBER_LIMIT_STATE.NEAR) {
      return t('emails.notes.NEAR', { percent, left });
    }
    return t('emails.notes.UNDER', { posts: postsLeft });
  };
  const narrowBandNote = () =>
    band.state === SUBSCRIBER_LIMIT_STATE.UNDER && !isUndefined(nextBand)
      ? t('band.narrowUnder', { left: band.left, next: nextBand })
      : bandNote();

  const bandDetail = t('band.detail', { ceiling: band.ceiling });
  const bandCopy: TLimitCardCopy = {
    name: t('band.name'),
    meterName: t('band.meter'),
    detail: bandDetail,
    narrowDetail: bandDetail,
    note: isEmpty ? undefined : bandNote(),
    narrowNote: isEmpty ? undefined : narrowBandNote(),
  };
  const emailsCopy: TLimitCardCopy = {
    name: t('emails.name'),
    meterName: t('emails.meter'),
    detail: t('emails.detail', {
      date: format.dateTime(resetsAt, DAY_MONTH_LONG_UTC),
    }),
    narrowDetail: t('emails.narrowDetail', {
      date: format.dateTime(resetsAt, DAY_MONTH_SHORT_UTC),
    }),
    note: isEmpty ? undefined : emailsNote(),
    narrowNote: undefined,
  };

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className={heading()}>
        {t('limitsHeading')}
      </h2>
      <div className={root()}>
        <LimitCard
          copy={bandCopy}
          used={band.count}
          limit={band.ceiling}
          state={band.state}
        />
        <LimitCard
          copy={emailsCopy}
          used={isEmpty ? 0 : emails.sent}
          limit={emails.allowance}
          state={emails.state}
        />
      </div>
    </section>
  );
};
