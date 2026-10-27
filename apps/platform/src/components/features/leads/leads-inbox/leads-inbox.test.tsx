import { ACTION_OUTCOME } from '@blog/config';
import { faker } from '@faker-js/faker';
import { LeadsTenantProvider } from '@platform/components/features/leads/leads-tenant-provider';
import messages from '@platform/i18n/messages/en.json';
import { deleteLeadAction } from '@platform/server/leads/delete-lead-action';
import { loadMoreLeadsAction } from '@platform/server/leads/load-more-leads-action';
import { setLeadReadAction } from '@platform/server/leads/set-lead-read-action';
import {
  renderWithIntl,
  screen,
  waitFor,
  within,
} from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
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

vi.mock('@platform/server/leads/set-lead-read-action');

vi.mock('@platform/server/leads/load-more-leads-action');

vi.mock('@platform/server/leads/get-lead-page-title-action');

vi.mock('@platform/server/leads/delete-lead-action');

const { leadsInbox, deleteLeadControl } = messages;
const t = makeEnTranslator('deleteLeadControl');

const LIST_COLUMN_TEST_ID = 'leads-list-column';
const MOCK_OLDER_LEAD_ID = faker.string.uuid();
const MOCK_OLDER_LEAD_NAME = faker.person.fullName();
const MOCK_OLDEST_LEAD_ID = faker.string.uuid();
const MOCK_OLDEST_LEAD_NAME = faker.person.fullName();
const MOCK_NEXT_CURSOR = {
  createdAt: faker.date.recent().toISOString(),
  id: MOCK_OLDER_LEAD_ID,
};

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
  const list = screen.getByRole('list', { name: leadsInbox.listLabel });
  return within(list).getByRole('button', {
    name: (accessibleName) => accessibleName.includes(name),
  });
};

describe(`<${LeadsInbox.name}/>`, () => {
  let user: UserEvent;
  let refresh: ReturnType<typeof mockRouterRefresh>;

  const deleteLead = async (name: string) => {
    const row = getRow(name);
    await user.click(row);
    const deleteTrigger = screen.getByRole('button', {
      name: t('triggerAriaLabel', { name }),
    });
    await user.click(deleteTrigger);
    const confirmButton = await screen.findByRole('button', {
      name: deleteLeadControl.confirmButton,
    });
    await user.click(confirmButton);
  };

  beforeEach(() => {
    user = userEvent.setup();
    refresh = mockRouterRefresh();
    vi.mocked(setLeadReadAction).mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    vi.mocked(loadMoreLeadsAction).mockReset();
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
      expect(row).toHaveTextContent(leadsInbox.unread);
    });

    it('puts the read state back and says so when saving it fails', async () => {
      vi.mocked(setLeadReadAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SERVER_ERROR,
      });

      await user.click(row);

      const error = await screen.findByText(leadsInbox.readStateFailed);
      expect(error).toBeVisible();
      expect(row).toHaveTextContent(leadsInbox.unread);
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
        expect(setLeadReadAction).toHaveBeenCalledWith(
          MOCK_TENANT_ID,
          MOCK_LEAD_ID,
          true,
        );
        expect(row).not.toHaveTextContent(leadsInbox.unread);
      });

      it('refreshes the sidebar count', async () => {
        await waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
      });

      it('shows the message in the reading pane', () => {
        const heading = screen.getByRole('heading', { name: MOCK_LEAD_NAME });

        expect(heading).toBeVisible();
      });

      describe('then marked unread from the reading pane', () => {
        beforeEach(async () => {
          const markUnreadButton = screen.getByRole('button', {
            name: leadsInbox.markUnread,
          });
          await user.click(markUnreadButton);
        });

        it('marks the lead unread again', () => {
          expect(setLeadReadAction).toHaveBeenLastCalledWith(
            MOCK_TENANT_ID,
            MOCK_LEAD_ID,
            false,
          );
          expect(row).toHaveTextContent(leadsInbox.unread);
        });

        it('returns focus to the lead it marked unread', () => {
          expect(row).toHaveFocus();
        });
      });

      describe('then closed with the back button', () => {
        beforeEach(async () => {
          const backButton = screen.getByRole('button', {
            name: leadsInbox.back,
          });
          await user.click(backButton);
        });

        it('shows the list again', () => {
          const placeholder = screen.getByText(leadsInbox.noSelection);
          const heading = screen.queryByRole('heading', {
            name: MOCK_LEAD_NAME,
          });

          expect(placeholder).toBeVisible();
          expect(heading).not.toBeInTheDocument();
        });

        it('returns focus to the lead it closed', () => {
          expect(row).toHaveFocus();
        });
      });
    });
  });

  describe('after deleting the open lead', () => {
    beforeEach(() => {
      vi.mocked(deleteLeadAction).mockResolvedValueOnce({
        outcome: ACTION_OUTCOME.SUCCESS,
      });
    });

    describe('with leads either side of it', () => {
      beforeEach(() => {
        renderInbox({
          leads: [
            mockInboxLead(),
            mockInboxLead({
              id: MOCK_OLDER_LEAD_ID,
              name: MOCK_OLDER_LEAD_NAME,
            }),
            mockInboxLead({
              id: MOCK_OLDEST_LEAD_ID,
              name: MOCK_OLDEST_LEAD_NAME,
            }),
          ],
        });
      });

      it('moves focus to the next lead', async () => {
        const nextRow = getRow(MOCK_OLDER_LEAD_NAME);

        await deleteLead(MOCK_LEAD_NAME);

        await waitFor(() => expect(nextRow).toHaveFocus());
      });

      it('moves focus to the previous lead when the deleted lead was last', async () => {
        const previousRow = getRow(MOCK_OLDER_LEAD_NAME);

        await deleteLead(MOCK_OLDEST_LEAD_NAME);

        await waitFor(() => expect(previousRow).toHaveFocus());
      });
    });

    it('moves focus to the list when no leads are left', async () => {
      renderInbox();

      await deleteLead(MOCK_LEAD_NAME);

      const listColumn = await screen.findByTestId(LIST_COLUMN_TEST_ID);
      await waitFor(() => expect(listColumn).toHaveFocus());
    });
  });

  it('does not mark a lead that is already read', async () => {
    renderInbox({ leads: [mockInboxLead({ isRead: true })] });
    const row = getRow(MOCK_LEAD_NAME);

    await user.click(row);

    expect(setLeadReadAction).not.toHaveBeenCalled();
  });

  it('loads the next leads when the end of the list scrolls into view', async () => {
    vi.mocked(loadMoreLeadsAction).mockResolvedValueOnce({
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
    const list = screen.getByRole('list', { name: leadsInbox.listLabel });
    const items = within(list).getAllByRole('listitem');
    expect(olderLead).toBeVisible();
    expect(items).toHaveLength(2);
    expect(loadMoreLeadsAction).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_NEXT_CURSOR,
    );
  });

  it('loads the next leads again when the owner retries a failed load', async () => {
    vi.mocked(loadMoreLeadsAction).mockResolvedValue({ isLoaded: false });
    renderInbox({ nextCursor: MOCK_NEXT_CURSOR });

    const retryButton = await screen.findByRole('button', {
      name: leadsInbox.loadMoreFailed,
    });
    await user.click(retryButton);

    expect(loadMoreLeadsAction).toHaveBeenCalledTimes(2);
  });
});
