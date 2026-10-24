import { ACTION_OUTCOME } from '@blog/config';
import { LeadsTenantProvider } from '@platform/components/features/leads/leads-tenant-provider';
import {
  act,
  renderWithIntl,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import { mockInboxLead } from '@platform/testing/leads/fixtures';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LeadsInbox } from './leads-inbox';

const { setLeadReadActionMock, loadMoreLeadsActionMock } = vi.hoisted(() => ({
  setLeadReadActionMock: vi.fn(),
  loadMoreLeadsActionMock: vi.fn(),
}));

vi.mock('@platform/server/leads/set-lead-read-action', () => ({
  setLeadReadAction: setLeadReadActionMock,
}));

vi.mock('@platform/server/leads/load-more-leads-action', () => ({
  loadMoreLeadsAction: loadMoreLeadsActionMock,
}));

vi.mock('@platform/server/leads/get-lead-page-title-action', () => ({
  getLeadPageTitleAction: vi.fn(),
}));

vi.mock('@platform/server/leads/delete-lead-action', () => ({
  deleteLeadAction: vi.fn(),
}));

const LEAD_ID = 'lead-1';
const ADA = 'Ada Lovelace';
const OLDER_LEAD_ID = 'lead-0';
const OLDER_LEAD = 'Older lead';
const NEXT_CURSOR = {
  createdAt: '2026-04-01 09:30:00+00',
  id: OLDER_LEAD_ID,
};
const MARK_UNREAD = 'Mark unread';
const UNREAD = 'Unread';

let observerCallback: IntersectionObserverCallback;

const reachEndOfList = () =>
  act(() =>
    observerCallback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    ),
  );

const setup = (
  leads = [mockInboxLead({ id: LEAD_ID, name: ADA })],
  nextCursor?: typeof NEXT_CURSOR,
) =>
  renderWithIntl(
    <LeadsTenantProvider tenantId={MOCK_TENANT_ID}>
      <LeadsInbox initialPage={{ leads, nextCursor }} />
    </LeadsTenantProvider>,
  );

const rowFor = (name: string) =>
  within(screen.getByRole('list')).getByRole('button', {
    name: new RegExp(name),
  });

const openLead = (user: UserEvent, name: string) => user.click(rowFor(name));

describe(`<${LeadsInbox.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    setLeadReadActionMock.mockReset();
    setLeadReadActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    loadMoreLeadsActionMock.mockReset();
    vi.stubGlobal(
      'IntersectionObserver',
      vi.fn(function (
        this: IntersectionObserver,
        callback: IntersectionObserverCallback,
      ) {
        observerCallback = callback;
        return { observe: vi.fn(), disconnect: vi.fn() };
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('marks an unread lead read when it opens, then refreshes the sidebar count', async () => {
    setup();
    const row = rowFor(ADA);
    expect(row).toHaveTextContent(UNREAD);

    await openLead(user, ADA);

    expect(setLeadReadActionMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      LEAD_ID,
      true,
    );
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(row).not.toHaveTextContent(UNREAD);
    expect(screen.getByRole('heading', { name: ADA })).toBeVisible();
  });

  it('does not mark an already read lead again', async () => {
    setup([mockInboxLead({ name: ADA, isRead: true })]);

    await openLead(user, ADA);

    expect(setLeadReadActionMock).not.toHaveBeenCalled();
  });

  it('marks the lead unread again from the reading pane', async () => {
    setup();
    await openLead(user, ADA);

    await user.click(screen.getByRole('button', { name: MARK_UNREAD }));

    expect(setLeadReadActionMock).toHaveBeenLastCalledWith(
      MOCK_TENANT_ID,
      LEAD_ID,
      false,
    );
    expect(rowFor(ADA)).toHaveTextContent(UNREAD);
  });

  it('puts the read state back and says so when saving it fails', async () => {
    setLeadReadActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    setup();

    await openLead(user, ADA);

    expect(
      await screen.findByText("Couldn't update the message. Try again."),
    ).toBeVisible();
    expect(rowFor(ADA)).toHaveTextContent(UNREAD);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('loads the next leads when the end of the list scrolls into view', async () => {
    loadMoreLeadsActionMock.mockResolvedValue({
      isLoaded: true,
      page: {
        leads: [mockInboxLead({ id: OLDER_LEAD_ID, name: OLDER_LEAD })],
        nextCursor: undefined,
      },
    });
    setup(undefined, NEXT_CURSOR);

    reachEndOfList();

    expect(await screen.findByText(OLDER_LEAD)).toBeVisible();
    expect(loadMoreLeadsActionMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      NEXT_CURSOR,
    );
    expect(
      within(screen.getByRole('list')).getAllByRole('listitem'),
    ).toHaveLength(2);
  });

  it('offers to try again when loading more fails', async () => {
    loadMoreLeadsActionMock.mockResolvedValue({ isLoaded: false });
    setup(undefined, NEXT_CURSOR);

    reachEndOfList();
    await user.click(
      await screen.findByRole('button', {
        name: "Couldn't load more messages. Try again",
      }),
    );

    expect(loadMoreLeadsActionMock).toHaveBeenCalledTimes(2);
  });

  it('shows the list again after going back from a message', async () => {
    setup();
    await openLead(user, ADA);

    await user.click(screen.getByRole('button', { name: 'Back to messages' }));

    expect(
      screen.getByText('Select a message to read it.'),
    ).toBeInTheDocument();
  });
});
