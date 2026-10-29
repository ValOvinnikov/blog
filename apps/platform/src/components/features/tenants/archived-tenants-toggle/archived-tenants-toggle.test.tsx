import { SORT_DIRECTION, TENANT_SORT_COLUMN } from '@blog/config';
import { useRouter } from '@platform/i18n/navigation';
import { customRender, screen } from '@platform/testing/custom-render';
import {
  mockTenantsListQuery,
  MOCK_TENANT_SLUG,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { ArchivedTenantsToggle } from './archived-tenants-toggle';

vi.mock('@platform/i18n/navigation');

const ACTIVE_LABEL = 'Active';
const ALL_LABEL = 'All';
const ARIA_PRESSED = 'aria-pressed';

const setup = customRender(ArchivedTenantsToggle, {
  listQuery: mockTenantsListQuery(),
});

describe(`<${ArchivedTenantsToggle.name}/>`, () => {
  let user: UserEvent;
  const push = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    vi.mocked(useRouter).mockReturnValue({ ...useRouter(), push });
  });

  it('shows Active selected by default', () => {
    setup();

    const activeButton = screen.getByRole('button', { name: ACTIVE_LABEL });

    expect(activeButton).toHaveAttribute(ARIA_PRESSED, 'true');
  });

  it('shows All selected when archived tenants are shown', () => {
    setup({ listQuery: mockTenantsListQuery({ shouldShowArchived: true }) });

    const allButton = screen.getByRole('button', { name: ALL_LABEL });

    expect(allButton).toHaveAttribute(ARIA_PRESSED, 'true');
  });

  it('navigates to the archived tenant list when All is selected', async () => {
    setup();

    const allButton = screen.getByRole('button', { name: ALL_LABEL });
    await user.click(allButton);

    expect(push).toHaveBeenCalledWith('/tenants?archived=1');
  });

  it('navigates back to the active-only list when Active is selected', async () => {
    setup({ listQuery: mockTenantsListQuery({ shouldShowArchived: true }) });

    const activeButton = screen.getByRole('button', { name: ACTIVE_LABEL });
    await user.click(activeButton);

    expect(push).toHaveBeenCalledWith('/tenants');
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
