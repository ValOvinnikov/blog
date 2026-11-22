import { Card } from '@platform/components/shared/card';
import { UsageMeter } from '@platform/components/shared/usage-meter';
import { METER_TONE, type TMeterTone } from '@platform/constants/meter';
import {
  SUBSCRIBER_LIMIT_STATE,
  type TSubscriberLimitState,
} from '@platform/constants/subscribers';
import type { TMaybeUndefined } from '@shinefold/config';
import { useTranslations } from 'next-intl';

import { limitCardVariants } from './limit-card-variants';

const STATE_TONE = {
  [SUBSCRIBER_LIMIT_STATE.UNDER]: METER_TONE.BRAND,
  [SUBSCRIBER_LIMIT_STATE.NEAR]: METER_TONE.WARN,
  [SUBSCRIBER_LIMIT_STATE.PAUSED]: METER_TONE.BAD,
} satisfies Record<TSubscriberLimitState, TMeterTone>;

export type TLimitCardCopy = {
  name: string;
  meterName: string;
  detail: string;
  narrowDetail: string;
  note: TMaybeUndefined<string>;
  narrowNote: TMaybeUndefined<string>;
};

export type TLimitCardProps = {
  copy: TLimitCardCopy;
  used: number;
  limit: number;
  state: TSubscriberLimitState;
};

export const LimitCard = ({ copy, used, limit, state }: TLimitCardProps) => {
  const t = useTranslations('subscribersPage');
  const { name, meterName, detail, narrowDetail, note, narrowNote } = copy;
  const {
    body,
    detail: detailSlot,
    value,
    count,
    note: noteSlot,
    wide,
    narrow,
  } = limitCardVariants({ state });

  return (
    <Card>
      <Card.Header
        title={name}
        headingLevel={3}
        actions={
          <span className={detailSlot()}>
            <span className={wide()}>{detail}</span>
            <span className={narrow()}>{narrowDetail}</span>
          </span>
        }
      />
      <Card.Body className={body()}>
        <p className={value()}>
          {t.rich('limitValue', {
            used,
            limit,
            count: (chunks) => <span className={count()}>{chunks}</span>,
          })}
        </p>
        <UsageMeter
          value={used}
          max={limit}
          aria={{ label: meterName }}
          tone={STATE_TONE[state]}
        />
        {note && <p className={noteSlot({ class: wide() })}>{note}</p>}
        {narrowNote && (
          <p className={noteSlot({ class: narrow() })}>{narrowNote}</p>
        )}
      </Card.Body>
    </Card>
  );
};
