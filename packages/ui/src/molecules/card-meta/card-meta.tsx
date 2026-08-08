import { ICONS, Size, type IWithDataTestId } from '@blog/config';
import { Icon } from '@blog/ui/atoms/icon';
import { MetaSeparator } from '@blog/ui/atoms/meta-separator';

import { cardMetaVariants } from './card-meta-variants';

export interface ICardMetaProps extends IWithDataTestId {
  /** ISO-8601 date string placed in `<time dateTime>`. */
  dateValue: string;
  /** Human-readable date string, pre-formatted by the web layer. */
  dateLabel: string;
  /** Optional reading time (e.g. "9 min"). Omitting hides the segment and its separator. */
  readingTime?: string;
  className?: string;
}

const s = cardMetaVariants();

/**
 * CardMeta — compact metadata row for post cards.
 * Renders: ❯ date [· readingTime]
 */
export const CardMeta = ({
  dateValue,
  dateLabel,
  readingTime,
  className,
  dataTestId,
}: ICardMetaProps) => (
  <div className={s.root({ class: className })} data-testid={dataTestId}>
    <Icon
      name={ICONS.CHEVRON_RIGHT}
      size={Size.SM}
      className={s.chevron()}
      dataTestId="card-meta-chevron"
    />
    <time dateTime={dateValue}>{dateLabel}</time>
    {readingTime && (
      <>
        <MetaSeparator />
        <span>{readingTime}</span>
      </>
    )}
  </div>
);
