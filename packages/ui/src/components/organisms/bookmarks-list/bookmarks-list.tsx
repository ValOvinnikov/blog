import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { TextLink } from '@blog/ui/components/atoms/text-link';
import type { ReactNode } from 'react';

import { bookmarksListVariants } from './bookmarks-list-variants';

export interface IBookmarkRow {
  id: string;
  formattedDate: string;
  filename: string;
  href: string;
}

export type TBookmarksListProps = IWithClassName &
  IWithDataTestId & {
    rows: IBookmarkRow[];
    emptyMessage: ReactNode;
    hint?: string;
    prefix?: ReactNode;
    linkAs?: TAnchorElementType;
  };

/** Lists a reader's saved posts, one row per bookmark with its date and a link to the post, or an empty state when there are none. */
export const BookmarksList = ({
  rows,
  emptyMessage,
  hint,
  prefix,
  linkAs,
  className,
  dataTestId,
}: TBookmarksListProps) => {
  const {
    root,
    list,
    row,
    date,
    hint: hintSlot,
    emptyMessage: emptyMessageSlot,
  } = bookmarksListVariants();
  const isEmpty = rows.length === 0;

  return (
    <div className={root({ class: className })} data-testid={dataTestId}>
      {isEmpty ? (
        <p className={emptyMessageSlot()}>{emptyMessage}</p>
      ) : (
        <>
          <ul role="list" className={list()}>
            {rows.map((bookmark) => (
              <li key={bookmark.id} className={row()}>
                {prefix}
                <span className={date()}>{bookmark.formattedDate}</span>
                <TextLink href={bookmark.href} as={linkAs} appearance="accent">
                  {bookmark.filename}
                </TextLink>
              </li>
            ))}
          </ul>
          {hint && <p className={hintSlot()}>{hint}</p>}
        </>
      )}
    </div>
  );
};
