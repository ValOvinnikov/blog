import { Heading } from '@blog/ui/components/atoms/heading';
import { Panel } from '@blog/ui/components/molecules/panel';
import {
  BookmarksList,
  type IBookmarkRow,
} from '@blog/ui/components/organisms/bookmarks-list';
import NextLink from 'next/link';

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
  listHeading: string;
  posts: IBookmarkedPost[];
  emptyMessage: string;
  hint?: string;
}

export const BookmarksPageView = ({
  heading,
  listHeading,
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
      <Heading level={1} visual="page" className={s.heading()}>
        {heading}
      </Heading>
      <Panel className={s.chrome()}>
        <Panel.Header headingLevel={2}>{listHeading}</Panel.Header>
        <Panel.Body>
          <BookmarksList
            rows={rows}
            emptyMessage={emptyMessage}
            hint={rows.length > 0 ? hint : undefined}
            linkAs={NextLink}
          />
        </Panel.Body>
      </Panel>
    </main>
  );
};
