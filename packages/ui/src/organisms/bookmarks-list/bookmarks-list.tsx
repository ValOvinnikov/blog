import type { IWithDataTestId } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import type { ElementType, ReactNode } from 'react';

import { bookmarksListVariants } from './bookmarks-list-variants';

export interface IBookmarkRow {
  id: string;
  /** Pre-formatted by web, e.g. "Aug 01". */
  formattedDate: string;
  /** e.g. "static-first-rendering.md" — web derives this from the post slug. */
  filename: string;
  href: string;
}

export interface IBookmarksListProps extends IWithDataTestId {
  rows: IBookmarkRow[];
  emptyMessage: string;
  /** Summary line rendered below the listing when `rows` isn't empty, e.g. "3 saved". */
  hint?: string;
  /** Arbitrary node rendered before each row's date, e.g. a `drwx`-style permission string or icon — rendered as-is with no wrapper, so the caller owns its element, styling, and accessibility. Same content for every row; omitted when not supplied. */
  prefix?: ReactNode;
  /** Component each row's filename link renders as — defaults to a plain `<a>`. Pass the app router's Link for client-side navigation. */
  linkAs?: TAnchorElementType;
  className?: string;
}

/**
 * BookmarksList — the `/bookmarks` page's terminal directory-listing body,
 * styled as `ls -l` output: one row per saved post with an optional
 * caller-supplied prefix glyph, a pre-formatted date, and the post rendered
 * as a filename-styled link. Renders `emptyMessage` in place of the listing
 * when there are no saved posts. The surrounding window-chrome shell (title
 * bar, `$ ls ~/bookmarks -l` prompt) is composed by the caller.
 */
export const BookmarksList = ({
  rows,
  emptyMessage,
  hint,
  prefix,
  linkAs,
  className,
  dataTestId,
}: IBookmarksListProps) => {
  const Component = (linkAs ?? 'a') as ElementType;
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
