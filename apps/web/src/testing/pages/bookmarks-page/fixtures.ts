import type {
  IBookmarkedPost,
  IBookmarksPageViewProps,
} from '@web/components/pages/bookmarks-page';

export const makeBookmarkedPost = (
  overrides: Partial<IBookmarkedPost> = {},
): IBookmarkedPost => {
  return {
    id: 'post-1',
    title: 'Static-first rendering, revisited',
    slug: 'static-first-rendering',
    href: '/blog/static-first-rendering',
    filename: 'static-first-rendering.md',
    formattedDate: 'August 1, 2026',
    ...overrides,
  };
};

export const makeBookmarksPageView = (
  overrides: Partial<IBookmarksPageViewProps> = {},
): IBookmarksPageViewProps => {
  const posts = overrides.posts ?? [
    makeBookmarkedPost(),
    makeBookmarkedPost({
      id: 'post-2',
      title: 'A tour of the new editor',
      slug: 'a-tour-of-the-new-editor',
      href: '/blog/a-tour-of-the-new-editor',
      filename: 'a-tour-of-the-new-editor.md',
      formattedDate: 'July 28, 2026',
    }),
  ];

  return {
    heading: 'My bookmarks',
    posts,
    isPlain: false,
    emptyMessage: 'No bookmarks yet — save a post to find it here.',
    hint: posts.length > 0 ? `${posts.length} saved` : undefined,
    promptSymbol: '',
    promptCommand: 'My bookmarks',
    promptFlag: '',
    ...overrides,
  };
};
