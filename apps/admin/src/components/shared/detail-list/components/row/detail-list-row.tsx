import type { ReactNode } from 'react';

import { detailListVariants } from '../../detail-list-variants';

export type TDetailListRowProps = {
  label: string;
  /** Applies monospace styling to the value (a domain, id, or hostname). */
  isMono?: boolean;
  /** The row's primary value — plain text or a `StatusBadge`. */
  children: ReactNode;
  /** An optional trailing link/button, rendered after the value. */
  action?: ReactNode;
  className?: string;
};

export const DetailListRow = ({
  label,
  isMono,
  children,
  action,
  className,
}: TDetailListRowProps) => {
  const { term, description, value } = detailListVariants({ isMono });

  return (
    <>
      <dt className={term()}>{label}</dt>
      <dd className={description({ class: className })}>
        <span className={value()}>{children}</span>
        {action}
      </dd>
    </>
  );
};
