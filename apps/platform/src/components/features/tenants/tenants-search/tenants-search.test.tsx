import { act, customRender, screen } from '@platform/testing/custom-render';
import { mockLocaleRouterPush } from '@platform/testing/mock-locale-router';
import {
  mockTenantsListQuery,
  MOCK_TENANT_SLUG,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { TenantsSearch } from './tenants-search';
import { TENANTS_SEARCH_DEBOUNCE_MS } from './use-tenants-search';

vi.mock('@platform/i18n/navigation');

const SEARCH_LABEL = 'Search tenants';
const CLEAR_LABEL = 'Clear search';
const SEARCH_URL = `/tenants?q=${MOCK_TENANT_SLUG}`;

const setup = customRender(TenantsSearch, {
  listQuery: mockTenantsListQuery(),
});

const getSearch = () => screen.getByRole('searchbox', { name: SEARCH_LABEL });

const waitOutDebounce = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(TENANTS_SEARCH_DEBOUNCE_MS);
  });
};

describe(`<${TenantsSearch.name}/>`, () => {
  let user: UserEvent;
  let push: ReturnType<typeof mockLocaleRouterPush>;

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    push = mockLocaleRouterPush();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('searches for the typed text once typing pauses', async () => {
    setup();

    await user.type(getSearch(), MOCK_TENANT_SLUG);
    expect(push).not.toHaveBeenCalled();

    await waitOutDebounce();

    expect(push).toHaveBeenCalledOnce();
    expect(push).toHaveBeenCalledWith(SEARCH_URL);
  });

  it('searches at once when Enter is pressed, ignoring surrounding spaces', async () => {
    setup();

    await user.type(getSearch(), `  ${MOCK_TENANT_SLUG} {Enter}`);
    await waitOutDebounce();

    expect(push).toHaveBeenCalledOnce();
    expect(push).toHaveBeenCalledWith(SEARCH_URL);
  });

  it('sends no search when only spaces around the current one change', async () => {
    setup({ listQuery: mockTenantsListQuery({ search: MOCK_TENANT_SLUG }) });

    await user.type(getSearch(), ' ');
    await waitOutDebounce();

    expect(push).not.toHaveBeenCalled();
  });

  it('keeps the archived filter when searching', async () => {
    setup({ listQuery: mockTenantsListQuery({ shouldShowArchived: true }) });

    await user.type(getSearch(), `${MOCK_TENANT_SLUG}{Enter}`);

    expect(push).toHaveBeenCalledWith(
      `/tenants?archived=1&q=${MOCK_TENANT_SLUG}`,
    );
  });

  it('keeps focus and the typed text when the results arrive', async () => {
    const { rerender } = setup();

    await user.type(getSearch(), `${MOCK_TENANT_SLUG}{Enter}`);
    rerender(
      <TenantsSearch
        listQuery={mockTenantsListQuery({ search: MOCK_TENANT_SLUG })}
      />,
    );

    expect(getSearch()).toHaveFocus();
    expect(getSearch()).toHaveValue(MOCK_TENANT_SLUG);
  });

  it('shows the search the URL changes to when the field did not request it', () => {
    const { rerender } = setup();

    rerender(
      <TenantsSearch
        listQuery={mockTenantsListQuery({ search: MOCK_TENANT_SLUG })}
      />,
    );

    expect(getSearch()).toHaveValue(MOCK_TENANT_SLUG);
  });

  it('offers no clear button while the field is empty', () => {
    setup();

    const clear = screen.queryByRole('button', { name: CLEAR_LABEL });

    expect(clear).not.toBeInTheDocument();
  });

  it('clears the search and keeps focus in the field', async () => {
    setup({ listQuery: mockTenantsListQuery({ search: MOCK_TENANT_SLUG }) });

    const clear = screen.getByRole('button', { name: CLEAR_LABEL });
    await user.click(clear);

    expect(getSearch()).toHaveValue('');
    expect(getSearch()).toHaveFocus();
    expect(push).toHaveBeenCalledWith('/tenants');
  });
});
