import { ACTION_OUTCOME } from '@blog/config';
import { faker } from '@faker-js/faker';
import { LeadsTenantProvider } from '@platform/components/features/leads/leads-tenant-provider';
import {
  renderWithIntl,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import {
  MOCK_LEAD_ID,
  MOCK_LEAD_NAME,
  mockInboxLead,
} from '@platform/testing/leads/fixtures';
import { mockRouterRefresh } from '@platform/testing/mock-router';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { LeadsInbox } from './leads-inbox';

faker.seed(5757);

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

vi.mock('@platform/server/leads/get-lead-page-title-action');

vi.mock('@platform/server/leads/delete-lead-action');

const MOCK_OLDER_LEAD_ID = faker.string.uuid();
const MOCK_OLDER_LEAD_NAME = faker.person.fullName();
const MOCK_NEXT_CURSOR = {
  createdAt: '2026-04-01 09:30:00.123456+00',
  id: MOCK_OLDER_LEAD_ID,
};
const MOCK_UNREAD_LABEL = 'Unread';
const MOCK_BACK_LABEL = 'Back to messages';
const MOCK_MARK_UNREAD_LABEL = 'Mark unread';

class EndOfListInView {
  constructor(private readonly callback: IntersectionObserverCallback) {}

  observe() {
    this.callback(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }

  disconnect() {}
}

const renderInbox = ({
  leads = [mockInboxLead()],
  nextCursor,
}: {
  leads?: ReturnType<typeof mockInboxLead>[];
  nextCursor?: typeof MOCK_NEXT_CURSOR;
} = {}) =>
  renderWithIntl(
    <LeadsTenantProvider tenantId={MOCK_TENANT_ID}>
      <LeadsInbox initialPage={{ leads, nextCursor }} />
    </LeadsTenantProvider>,
  );

const getRow = (name: string) => {
  const list = screen.getByRole('list');
  return within(list).getByRole('button', {
    name: (accessibleName) => accessibleName.includes(name),
  });
};

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
    vi.stubGlobal('IntersectionObserver', EndOfListInView);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('with an unread lead', () => {
    let row: HTMLElement;

    beforeEach(() => {
      renderInbox();
      row = getRow(MOCK_LEAD_NAME);
    });

    it('marks the lead unread in the list', () => {
      expect(row).toHaveTextContent(MOCK_UNREAD_LABEL);
    });

    it('puts the read state back and says so when saving it fails', async () => {
      setLeadReadActionMock.mockResolvedValue({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });

      await user.click(row);

      const error = await screen.findByText(
        "Couldn't update the message. Try again.",
      );
      expect(error).toBeVisible();
      expect(row).toHaveTextContent(MOCK_UNREAD_LABEL);
      expect(refresh).not.toHaveBeenCalled();
    });

    it('moves focus to the message heading when the lead is opened by keyboard', async () => {
      await user.tab();
      await user.keyboard('{Enter}');

      const heading = screen.getByRole('heading', { name: MOCK_LEAD_NAME });
      const headingName = within(heading).getByText(MOCK_LEAD_NAME);
      expect(headingName).toHaveFocus();
    });

    describe('once opened', () => {
      beforeEach(async () => {
        await user.click(row);
      });

      it('marks the lead read', () => {
        expect(setLeadReadActionMock).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          MOCK_LEAD_ID,
          true,
        );
        expect(row).not.toHaveTextContent(MOCK_UNREAD_LABEL);
      });

      it('refreshes the sidebar count', async () => {
        await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
      });

      it('shows the message in the reading pane', () => {
        const heading = screen.getByRole('heading', { name: MOCK_LEAD_NAME });

        expect(heading).toBeVisible();
      });

      it('marks the lead unread again from the reading pane', async () => {
        const markUnreadButton = screen.getByRole('button', {
          name: MOCK_MARK_UNREAD_LABEL,
        });

        await user.click(markUnreadButton);

        expect(setLeadReadActionMock).toHaveBeenLastCalledWith(
          MOCK_TENANT_ID,
          MOCK_LEAD_ID,
          false,
        );
        expect(row).toHaveTextContent(MOCK_UNREAD_LABEL);
      });

      it('shows the list again after going back from the message', async () => {
        const backButton = screen.getByRole('button', {
          name: MOCK_BACK_LABEL,
        });

        await user.click(backButton);

        const placeholder = screen.getByText('Select a message to read it.');
        const heading = screen.queryByRole('heading', { name: MOCK_LEAD_NAME });
        expect(placeholder).toBeVisible();
        expect(heading).not.toBeInTheDocument();
      });

      it('returns focus to the lead after going back from the message', async () => {
        const backButton = screen.getByRole('button', {
          name: MOCK_BACK_LABEL,
        });

        await user.click(backButton);

        expect(row).toHaveFocus();
      });

      it('returns focus to the lead after marking it unread', async () => {
        const markUnreadButton = screen.getByRole('button', {
          name: MOCK_MARK_UNREAD_LABEL,
        });

        await user.click(markUnreadButton);

        expect(row).toHaveFocus();
      });
    });
  });

  it('does not mark a lead that is already read', async () => {
    renderInbox({ leads: [mockInboxLead({ isRead: true })] });
    const row = getRow(MOCK_LEAD_NAME);

    await user.click(row);

    expect(setLeadReadActionMock).not.toHaveBeenCalled();
  });

  it('loads the next leads when the end of the list scrolls into view', async () => {
    loadMoreLeadsActionMock.mockResolvedValue({
      isLoaded: true,
      page: {
        leads: [
          mockInboxLead({ id: MOCK_OLDER_LEAD_ID, name: MOCK_OLDER_LEAD_NAME }),
        ],
        nextCursor: undefined,
      },
    });

    renderInbox({ nextCursor: MOCK_NEXT_CURSOR });

    const olderLead = await screen.findByText(MOCK_OLDER_LEAD_NAME);
    const list = screen.getByRole('list');
    const items = within(list).getAllByRole('listitem');
    expect(olderLead).toBeVisible();
    expect(items).toHaveLength(2);
    expect(loadMoreLeadsActionMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_NEXT_CURSOR,
    );
  });

  it('loads the next leads again when the owner retries a failed load', async () => {
    loadMoreLeadsActionMock.mockResolvedValue({ isLoaded: false });
    renderInbox({ nextCursor: MOCK_NEXT_CURSOR });

    const retryButton = await screen.findByRole('button', {
      name: "Couldn't load more messages. Try again",
    });
    await user.click(retryButton);

    expect(loadMoreLeadsActionMock).toHaveBeenCalledTimes(2);
  });
});
