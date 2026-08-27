import { Heading } from '@blog/ui/atoms/heading';
import { Text } from '@blog/ui/atoms/text';
import { WindowChrome } from '@blog/ui/molecules/window-chrome';
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
  isPlain: boolean;
  emptyMessage: string;
  hint?: string;
  promptSymbol: string;
  promptCommand: string;
  promptFlag: string;
}

/**
 * Pure view for `BookmarksPage`: renders as a terminal directory listing
 * (`WindowChrome` + `BookmarksList`, `$ ls ~/bookmarks -l`) when `isPlain` is
 * false, or a plain list of title links when `isPlain` is true. `posts` is
 * the already auth/tenant/db-resolved, post-joined bookmark list — this
 * component has no knowledge of auth, tenant, or the db layer.
 */
export const BookmarksPageView = ({
  heading,
  posts,
  isPlain,
  emptyMessage,
  hint,
  promptSymbol,
  promptCommand,
  promptFlag,
}: IBookmarksPageViewProps) => {
  const rows: IBookmarkRow[] = posts.map((post) => ({
    id: post.id,
    formattedDate: post.formattedDate,
    filename: post.filename,
    href: post.href,
  }));

  const plainContent =
    posts.length === 0 ? (
      <Text>{emptyMessage}</Text>
    ) : (
      <>
        <ul role="list" className={s.plainList()}>
          {posts.map((post) => (
            <li key={post.id} className={s.plainRow()}>
              <SmartLink href={post.href} className={s.plainLink()}>
                {post.title}
              </SmartLink>
              <span className={s.plainDate()}>{post.formattedDate}</span>
            </li>
          ))}
        </ul>
        <Text variant="meta" className={s.plainHint()}>
          {hint}
        </Text>
      </>
    );

  return (
    <main className={s.root()}>
      <Heading level={1} visual="section" className={s.heading()}>
        {heading}
      </Heading>
      {isPlain ? (
        <div className={s.plainRoot()}>{plainContent}</div>
      ) : (
        <WindowChrome className={s.chrome()}>
          <WindowChrome.Bar>
            <WindowChrome.Prompt>{promptSymbol}</WindowChrome.Prompt>{' '}
            {promptCommand} <WindowChrome.User>{promptFlag}</WindowChrome.User>
          </WindowChrome.Bar>
          <WindowChrome.Body>
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
          </WindowChrome.Body>
        </WindowChrome>
      )}
    </main>
  );
};
