import { useRouter } from '@platform/i18n/navigation';
import { customRender, screen } from '@platform/testing/custom-render';
import {
  mockTenantsListQuery,
  MOCK_TENANT_SLUG,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { TenantsSearch } from './tenants-search';

vi.mock('@platform/i18n/navigation');

const SEARCH_LABEL = 'Search tenants';

const setup = customRender(TenantsSearch, {
  listQuery: mockTenantsListQuery(),
});

describe(`<${TenantsSearch.name}/>`, () => {
  let user: UserEvent;
  const push = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    push.mockReset();
    vi.mocked(useRouter).mockReturnValue({ ...useRouter(), push });
  });

  it('searches for the typed text when Enter is pressed', async () => {
    setup();

    const search = screen.getByRole('searchbox', { name: SEARCH_LABEL });
    await user.type(search, `  ${MOCK_TENANT_SLUG} {Enter}`);

    expect(push).toHaveBeenCalledWith(`/tenants?q=${MOCK_TENANT_SLUG}`);
  });

  it('keeps the archived filter when searching', async () => {
    setup({ listQuery: mockTenantsListQuery({ shouldShowArchived: true }) });

    const search = screen.getByRole('searchbox', { name: SEARCH_LABEL });
    await user.type(search, `${MOCK_TENANT_SLUG}{Enter}`);

    expect(push).toHaveBeenCalledWith(
      `/tenants?archived=1&q=${MOCK_TENANT_SLUG}`,
    );
  });

  it('shows the current search and drops it once cleared', async () => {
    setup({ listQuery: mockTenantsListQuery({ search: MOCK_TENANT_SLUG }) });

    const search = screen.getByRole('searchbox', { name: SEARCH_LABEL });
    await user.clear(search);

    expect(push).toHaveBeenCalledWith('/tenants');
  });
});
