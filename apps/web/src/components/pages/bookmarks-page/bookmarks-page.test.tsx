import { LOCALE_ISO_CODES, NEXT_NAVIGATION_ERROR, routes } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getVoiceRich } from '@web/server/site-config/get-voice-rich/get-voice-rich';
import { customRenderAsync, screen } from '@web/testing/custom-render';
import { mockPostCard } from '@web/testing/shared/post/fixtures';
import {
  MOCK_REQUEST_CONTEXT,
  MOCK_TENANT_ID,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';
import { mockFormattedVoiceRich } from '@web/testing/shared/voice/fixtures';
import { redirect } from 'next/navigation';

import { BookmarksPage } from './bookmarks-page';

vi.mock('@web/server/request-context/request-context');
vi.mock('@web/server/site-config/get-voice-rich/get-voice-rich');

const { authMock, listBookmarksMock, getPostsByIdsMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  listBookmarksMock: vi.fn(),
  getPostsByIdsMock: vi.fn(),
}));

vi.mock('@web/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', () => ({
  queries: { bookmarks: { listBookmarks: listBookmarksMock } },
}));

vi.mock('@blog/service', () => ({
  service: {
    entities: {
      posts: { v1: { getPostsByIds: getPostsByIdsMock } },
    },
  },
}));

faker.seed(6008);

const { EN, NL } = LOCALE_ISO_CODES;
const LINK_TEXT = 'browse the blog';
const EMPTY_MESSAGE = 'No bookmarks yet — save a post to find it here.';
const MOCK_USER_ID = faker.string.uuid();
const MOCK_CREATED_AT = faker.date.past();
const MOCK_FIRST_POST_ID = faker.string.uuid();
const MOCK_SECOND_POST_ID = faker.string.uuid();
const MOCK_FIRST_SLUG = faker.lorem.slug();
const MOCK_SECOND_SLUG = faker.lorem.slug();
const MOCK_NL_SLUG = faker.lorem.slug();
const MOCK_OTHER_SANITY_CONTEXT = {
  projectId: faker.string.alphanumeric(8),
  dataset: faker.string.alphanumeric(8),
  token: faker.string.uuid(),
};

const mockBookmark = (postId: string) => ({
  userId: MOCK_USER_ID,
  postId,
  createdAt: MOCK_CREATED_AT,
});

const setup = customRenderAsync(BookmarksPage, {});

describe(`<${BookmarksPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    listBookmarksMock.mockReset();
    getPostsByIdsMock.mockReset();
    authMock.mockResolvedValue({ user: { id: MOCK_USER_ID } });
    listBookmarksMock.mockResolvedValue([]);
    getPostsByIdsMock.mockResolvedValue(okResult([]));
  });

  it('redirects home without querying bookmarks when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(vi.mocked(redirect)).toHaveBeenCalledWith(routes.home());
    expect(listBookmarksMock).not.toHaveBeenCalled();
    expect(getPostsByIdsMock).not.toHaveBeenCalled();
  });

  it('redirects home without querying bookmarks when no tenant resolves', async () => {
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      tenantId: undefined,
    });

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(vi.mocked(redirect)).toHaveBeenCalledWith(routes.home());
    expect(listBookmarksMock).not.toHaveBeenCalled();
    expect(getPostsByIdsMock).not.toHaveBeenCalled();
  });

  it('resolves the signed-in user and tenant bookmarks into posts', async () => {
    await setup();

    expect(listBookmarksMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_USER_ID,
    );
    expect(getPostsByIdsMock).toHaveBeenCalledWith(
      [],
      MOCK_TENANT_SANITY_CONTEXT,
    );
  });

  it('forwards the request context Sanity context to getPostsByIds', async () => {
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      sanityContext: MOCK_OTHER_SANITY_CONTEXT,
    });

    await setup();

    expect(getPostsByIdsMock).toHaveBeenCalledWith(
      [],
      MOCK_OTHER_SANITY_CONTEXT,
    );
  });

  it('re-sorts resolved posts back into bookmark-recency order', async () => {
    listBookmarksMock.mockResolvedValue([
      mockBookmark(MOCK_SECOND_POST_ID),
      mockBookmark(MOCK_FIRST_POST_ID),
    ]);
    getPostsByIdsMock.mockResolvedValue(
      okResult([
        {
          ...mockPostCard({ id: MOCK_FIRST_POST_ID, slug: MOCK_FIRST_SLUG }),
          language: EN,
        },
        {
          ...mockPostCard({ id: MOCK_SECOND_POST_ID, slug: MOCK_SECOND_SLUG }),
          language: EN,
        },
      ]),
    );

    await setup();

    const links = screen.getAllByRole('link');
    const secondLink = screen.getByRole('link', {
      name: `${MOCK_SECOND_SLUG}.md`,
    });
    const firstLink = screen.getByRole('link', {
      name: `${MOCK_FIRST_SLUG}.md`,
    });

    expect(getPostsByIdsMock).toHaveBeenCalledWith(
      [MOCK_SECOND_POST_ID, MOCK_FIRST_POST_ID],
      MOCK_TENANT_SANITY_CONTEXT,
    );
    expect(links.map((link) => link.textContent)).toEqual([
      `${MOCK_SECOND_SLUG}.md`,
      `${MOCK_FIRST_SLUG}.md`,
    ]);
    expect(secondLink).toHaveAttribute('href', routes.post(MOCK_SECOND_SLUG));
    expect(firstLink).toHaveAttribute('href', routes.post(MOCK_FIRST_SLUG));
  });

  it('links each bookmark to the language it was saved in', async () => {
    listBookmarksMock.mockResolvedValue([
      mockBookmark(MOCK_SECOND_POST_ID),
      mockBookmark(MOCK_FIRST_POST_ID),
    ]);
    getPostsByIdsMock.mockResolvedValue(
      okResult([
        {
          ...mockPostCard({ id: MOCK_SECOND_POST_ID, slug: MOCK_NL_SLUG }),
          language: NL,
        },
        {
          ...mockPostCard({ id: MOCK_FIRST_POST_ID, slug: MOCK_FIRST_SLUG }),
          language: EN,
        },
      ]),
    );
    vi.mocked(getRequestContext).mockResolvedValueOnce({
      ...MOCK_REQUEST_CONTEXT,
      locale: NL,
      defaultLocale: EN,
    });

    await setup();

    const dutchLink = screen.getByRole('link', { name: `${MOCK_NL_SLUG}.md` });
    const englishLink = screen.getByRole('link', {
      name: `${MOCK_FIRST_SLUG}.md`,
    });

    expect(dutchLink).toHaveAttribute(
      'href',
      `/${NL.toLowerCase()}${routes.post(MOCK_NL_SLUG)}`,
    );
    expect(englishLink).toHaveAttribute('href', routes.post(MOCK_FIRST_SLUG));
  });

  it('renders the catalog empty message when there are no bookmarks', async () => {
    await setup();

    const emptyMessage = screen.getByText(EMPTY_MESSAGE);

    expect(vi.mocked(getVoiceRich)).toHaveBeenCalledWith('bookmarksEmpty');
    expect(emptyMessage).toBeVisible();
  });

  it('renders the tenant-authored empty message with its formatting and link', async () => {
    vi.mocked(getVoiceRich).mockResolvedValueOnce(
      mockFormattedVoiceRich({ linkText: LINK_TEXT, href: routes.blogIndex() }),
    );

    await setup();

    const inlineLink = screen.getByRole('link', { name: LINK_TEXT });
    const boldText = screen.getByText('bold', { selector: 'strong' });
    const italicText = screen.getByText('italic', { selector: 'em' });

    expect(inlineLink).toHaveAttribute('href', routes.blogIndex());
    expect(boldText).toBeVisible();
    expect(italicText).toBeVisible();
  });

  it('renders nothing when resolving bookmarked posts fails', async () => {
    listBookmarksMock.mockResolvedValue([mockBookmark(MOCK_FIRST_POST_ID)]);
    getPostsByIdsMock.mockResolvedValue(
      errorResult(new Error(faker.lorem.sentence())),
    );

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });
});
