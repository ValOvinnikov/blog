import type { IWithDataTestId } from '@blog/config';
import { MetaSeparator } from '@blog/ui/atoms/meta-separator';

import { cardMetaVariants } from './card-meta-variants';

export interface ICardMetaProps extends IWithDataTestId {
  /** ISO-8601 date string placed in `<time dateTime>`. */
  dateValue: string;
  /** Human-readable date string, pre-formatted by the web layer. */
  dateLabel: string;
  /** Optional reading time (e.g. "9 min"). Omitting hides the segment and its separator. */
  readingTime?: string;
  /** Post category displayed in uppercase accent colour. */
  category: string;
  className?: string;
}

const s = cardMetaVariants();

/**
 * CardMeta — compact metadata row for post cards.
 * Renders: date [· readingTime] · CATEGORY
 */
export const CardMeta = ({
  dateValue,
  dateLabel,
  readingTime,
  category,
  className,
  dataTestId,
}: ICardMetaProps) => (
  <div className={s.root({ class: className })} data-testid={dataTestId}>
    <time dateTime={dateValue}>{dateLabel}</time>
    {readingTime && (
      <>
        <MetaSeparator />
        <span>{readingTime}</span>
      </>
    )}
    <MetaSeparator />
    <span className={s.category()}>{category.toUpperCase()}</span>
  </div>
);
