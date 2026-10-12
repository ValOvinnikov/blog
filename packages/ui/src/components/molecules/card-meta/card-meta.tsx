import { type IWithClassName, type IWithDataTestId } from '@blog/config';
import { MetaSeparator } from '@blog/ui/components/atoms/meta-separator';

import { cardMetaVariants } from './card-meta-variants';

export type TCardMetaProps = IWithClassName &
  IWithDataTestId & {
    dateValue: string;
    dateLabel: string;
    readingTime?: string;
  };

const s = cardMetaVariants();

/** Compact metadata row for cards. */
export const CardMeta = ({
  dateValue,
  dateLabel,
  readingTime,
  className,
  dataTestId,
}: TCardMetaProps) => (
  <div className={s.root({ class: className })} data-testid={dataTestId}>
    <time dateTime={dateValue}>{dateLabel}</time>
    {readingTime && (
      <>
        <MetaSeparator />
        <span>{readingTime}</span>
      </>
    )}
  </div>
);
