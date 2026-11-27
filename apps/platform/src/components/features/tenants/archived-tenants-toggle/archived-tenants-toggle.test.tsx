import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import { customRender, screen } from '@platform/testing/custom-render';
import { mockLocaleRouterPush } from '@platform/testing/mock-locale-router';
import {
  mockTenantsListQuery,
  MOCK_TENANT_SLUG,
} from '@platform/testing/tenants/fixtures';
import { SORT_DIRECTION, TENANT_SORT_COLUMN } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { ArchivedTenantsToggle } from './archived-tenants-toggle';

vi.mock('@platform/i18n/navigation');

const ACTIVE_LABEL = 'Active';
const ALL_LABEL = 'All';

const setup = customRender(ArchivedTenantsToggle, {
  listQuery: mockTenantsListQuery(),
});

describe(`<${ArchivedTenantsToggle.name}/>`, () => {
  let user: UserEvent;
  let push: ReturnType<typeof mockLocaleRouterPush>;

  beforeEach(() => {
    user = userEvent.setup();
    push = mockLocaleRouterPush();
  });

  describe('by default', () => {
    beforeEach(() => {
      setup();
    });

    it('shows Active selected', () => {
      const activeButton = screen.getByRole('button', { name: ACTIVE_LABEL });

      expect(activeButton).toHaveAttribute(ARIA_ATTRIBUTE.PRESSED, 'true');
    });

    it('navigates to the archived tenant list when All is selected', async () => {
      const allButton = screen.getByRole('button', { name: ALL_LABEL });
      await user.click(allButton);

      expect(push).toHaveBeenCalledWith('/tenants?archived=1');
    });
  });

  describe('when archived tenants are shown', () => {
    beforeEach(() => {
      setup({ listQuery: mockTenantsListQuery({ shouldShowArchived: true }) });
    });

    it('shows All selected', () => {
      const allButton = screen.getByRole('button', { name: ALL_LABEL });

      expect(allButton).toHaveAttribute(ARIA_ATTRIBUTE.PRESSED, 'true');
    });

    it('navigates back to the active-only list when Active is selected', async () => {
      const activeButton = screen.getByRole('button', { name: ACTIVE_LABEL });
      await user.click(activeButton);

      expect(push).toHaveBeenCalledWith('/tenants');
    });
  });

  it('keeps the sort and search when the visibility changes', async () => {
    setup({
      listQuery: mockTenantsListQuery({
        sort: {
          column: TENANT_SORT_COLUMN.NAME,
          direction: SORT_DIRECTION.ASCENDING,
        },
        search: MOCK_TENANT_SLUG,
      }),
    });

    const allButton = screen.getByRole('button', { name: ALL_LABEL });
    await user.click(allButton);

    expect(push).toHaveBeenCalledWith(
      `/tenants?archived=1&sort=NAME&direction=ascending&q=${MOCK_TENANT_SLUG}`,
    );
  });
});
