import { Heading } from '@blog/ui/atoms/heading';
import { Panel } from '@blog/ui/molecules/panel';
import {
  BookmarksList,
  type IBookmarkRow,
} from '@blog/ui/organisms/bookmarks-list';
import { SmartLink } from '@web/components/shared/smart-link';

import { bookmarksPageVariants } from './bookmarks-page-variants';

const s = bookmarksPageVariants();

export interface IBookmarkedPost {
  id: string;
  title: string;
  slug: string;
  href: string;
  filename: string;
  formattedDate: string;
}

export interface IBookmarksPageViewProps {
  heading: string;
  posts: IBookmarkedPost[];
  emptyMessage: string;
  hint?: string;
}

/**
 * Pure view for `BookmarksPage`: the page heading plus a `Panel` framing the
 * resolved bookmark list. `posts` is the already auth/tenant/db-resolved,
 * post-joined bookmark list — this component has no knowledge of auth,
 * tenant, or the db layer.
 */
export const BookmarksPageView = ({
  heading,
  posts,
  emptyMessage,
  hint,
}: IBookmarksPageViewProps) => {
  const rows: IBookmarkRow[] = posts.map((post) => ({
    id: post.id,
    formattedDate: post.formattedDate,
    filename: post.filename,
    href: post.href,
  }));

  return (
    <main className={s.root()}>
      <Heading level={1} visual="section" className={s.heading()}>
        {heading}
      </Heading>
      <Panel className={s.chrome()}>
        <Panel.Header headingLevel={2}>{heading}</Panel.Header>
        <Panel.Body>
          <BookmarksList
            rows={rows}
            emptyMessage={emptyMessage}
            hint={rows.length > 0 ? hint : undefined}
            prefix={
              <span
                aria-hidden="true"
                data-testid="bookmarks-list-row-prefix"
                className={s.prefix()}
              >
                drwx
              </span>
            }
            linkAs={SmartLink}
          />
        </Panel.Body>
      </Panel>
    </main>
  );
};
