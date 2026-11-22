/**
 * @vitest-environment jsdom
 */
import { faker } from '@faker-js/faker';
import { ThemeProvider } from '@sanity/ui';
import { buildTheme } from '@sanity/ui/theme';
import { ToastProvider } from '@sanity/ui/toast';
import {
  ACTION_OUTCOME,
  LOCALE_ISO_CODES,
  routes,
  type TNewsletterTestSendResult,
} from '@shinefold/config';
import type { IWithChildren } from '@shinefold/config/react';
import { stubMatchMedia } from '@shinefold/studio/testing/stub-match-media';
import { act, cleanup, renderHook, screen } from '@testing-library/react';
import type {
  DocumentActionDescription,
  DocumentActionProps,
  SanityDocument,
} from 'sanity';

import { SendTestAction } from './send-test-action';
import { SEND_TEST_FAILED_TOAST, toSendTestToast } from './send-test-toast';

const fetchSavedPost = vi.fn();

vi.mock('sanity', async (importOriginal) => ({
  ...(await importOriginal<typeof import('sanity')>()),
  useClient: () => ({ withConfig: () => ({ fetch: fetchSavedPost }) }),
  useProjectId: () => MOCK_PROJECT_ID,
  useCurrentUser: () => ({ email: MOCK_EMAIL }),
}));

faker.seed(7711);

const MOCK_PROJECT_ID = faker.string.alphanumeric(8);
const MOCK_EMAIL = faker.internet.email();
const MOCK_POST_ID = faker.string.uuid();
const MOCK_TITLE = faker.lorem.sentence();
const MOCK_SLUG = faker.lorem.slug();
const MOCK_DRAFT = {
  _id: `drafts.${MOCK_POST_ID}`,
} as SanityDocument;
const TEST_SENT: TNewsletterTestSendResult = {
  outcome: ACTION_OUTCOME.SUCCESS,
};

const MOCK_SAVED_POST = {
  title: MOCK_TITLE,
  slug: { _type: 'slug', current: MOCK_SLUG },
  language: LOCALE_ISO_CODES.EN,
};

const fetchMock = vi.fn<typeof fetch>(async () => Response.json(TEST_SENT));

const Providers = ({ children }: IWithChildren) => (
  <ThemeProvider theme={buildTheme()}>
    <ToastProvider>{children}</ToastProvider>
  </ThemeProvider>
);

const renderAction = (draft: SanityDocument | null) =>
  renderHook(
    () =>
      SendTestAction({
        draft,
        published: null,
      } as DocumentActionProps) as DocumentActionDescription,
    { wrapper: Providers },
  ).result;

const sendTest = async (draft: SanityDocument) => {
  const action = renderAction(draft);
  await act(async () => {
    action.current.onHandle?.();
  });
};

afterEach(() => {
  cleanup();
});

describe(SendTestAction, () => {
  beforeEach(() => {
    stubMatchMedia();
    vi.stubGlobal('fetch', fetchMock);
  });

  it('is disabled until the post has been saved', () => {
    const action = renderAction(null);

    expect(action.current.disabled).toBe(true);
  });

  it('sends the saved fields to the test route and names the address', async () => {
    fetchSavedPost.mockResolvedValueOnce(MOCK_SAVED_POST);
    await sendTest(MOCK_DRAFT);

    const toast = await screen.findByText(
      String(toSendTestToast(TEST_SENT, MOCK_EMAIL).title),
    );
    const [[path, init]] = fetchMock.mock.calls as [[string, RequestInit]];

    expect(toast.textContent).toContain(MOCK_EMAIL);
    expect([path, JSON.parse(String(init.body))]).toStrictEqual([
      routes.newsletterPostTestSend(),
      {
        projectId: MOCK_PROJECT_ID,
        title: MOCK_TITLE,
        excerpt: '',
        slug: MOCK_SLUG,
        takeaways: [],
        locale: LOCALE_ISO_CODES.EN,
      },
    ]);
  });

  it('says the test failed when the saved post has nothing to send', async () => {
    fetchSavedPost.mockResolvedValueOnce({ ...MOCK_SAVED_POST, slug: null });
    await sendTest(MOCK_DRAFT);

    const toast = await screen.findByText(String(SEND_TEST_FAILED_TOAST.title));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(toast.textContent).toBe(SEND_TEST_FAILED_TOAST.title);
  });
});
