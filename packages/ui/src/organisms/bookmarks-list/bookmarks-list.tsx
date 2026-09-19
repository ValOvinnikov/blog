import type { IWithClassName, IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { resolveComponent } from '@blog/ui/lib/react';
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
    emptyMessage: string;
    hint?: string;
    prefix?: ReactNode;
    linkAs?: TAnchorElementType;
  };

/** Renders a reader's saved posts as one row per bookmark, each with a date and a link to the post, or `emptyMessage` when there are none. */
export const BookmarksList = ({
  rows,
  emptyMessage,
  hint,
  prefix,
  linkAs,
  className,
  dataTestId,
}: TBookmarksListProps) => {
  const Component = resolveComponent(linkAs, 'a');
  const {
    root,
    list,
    row,
    date,
    filename,
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
                <Component href={bookmark.href} className={filename()}>
                  {bookmark.filename}
                </Component>
              </li>
            ))}
          </ul>
          {hint && <p className={hintSlot()}>{hint}</p>}
        </>
      )}
    </div>
  );
};
