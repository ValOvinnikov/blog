import { routes } from '@blog/config';
import type {
  IBookmarkedPost,
  IBookmarksPageViewProps,
} from '@web/components/pages/bookmarks-page/bookmarks-page-view';
import { createMockFaker } from '@web/testing/mock-faker';

const mockFaker = createMockFaker(61036);

const MOCK_BOOKMARKS_HEADING = mockFaker.lorem.words(2);
const MOCK_LIST_HEADING = mockFaker.lorem.words(2);
const MOCK_EMPTY_MESSAGE = mockFaker.lorem.sentence();
const MOCK_HINT = mockFaker.lorem.words(2);
const MOCK_BOOKMARK_REF_DATE = '2026-08-01T00:00:00Z';

const mockBookmarkedPost = (): IBookmarkedPost => {
  const slug = mockFaker.lorem.slug(3);

  return {
    id: mockFaker.string.uuid(),
    title: mockFaker.lorem.sentence(),
    slug,
    href: routes.post(slug),
    filename: `${slug}.md`,
    formattedDate: mockFaker.date
      .past({ refDate: MOCK_BOOKMARK_REF_DATE })
      .toDateString(),
  };
};

const MOCK_BOOKMARKED_POSTS = [mockBookmarkedPost(), mockBookmarkedPost()];

export const mockBookmarksPageView = (
  overrides: Partial<IBookmarksPageViewProps> = {},
): IBookmarksPageViewProps => {
  const posts = overrides.posts ?? MOCK_BOOKMARKED_POSTS;

  return {
    heading: MOCK_BOOKMARKS_HEADING,
    listHeading: MOCK_LIST_HEADING,
    posts,
    emptyMessage: MOCK_EMPTY_MESSAGE,
    hint: posts.length > 0 ? MOCK_HINT : undefined,
    ...overrides,
  };
};
