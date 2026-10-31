import { SORT_DIRECTION, TENANT_SORT_COLUMN } from '@blog/config';
import { TENANTS_SEARCH_DEBOUNCE_MS } from '@platform/constants/tenant';
import {
  act,
  customRender,
  screen,
  type RenderResult,
} from '@platform/testing/custom-render';
import { mockLocaleRouter } from '@platform/testing/mock-locale-router';
import {
  mockTenantsListQuery,
  MOCK_TENANT_SLUG,
} from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';
import type { Mock } from 'vitest';

import { TenantsSearch } from './tenants-search';

vi.mock('@platform/i18n/navigation');

const SEARCH_LABEL = 'Search tenants';
const CLEAR_LABEL = 'Clear search';
const FIRST_LETTER = MOCK_TENANT_SLUG.slice(0, 1);
const REST_OF_SLUG = MOCK_TENANT_SLUG.slice(1);
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
  let replace: Mock;
  let view: RenderResult;

  const showUrlSearch = (search: string) => {
    view.rerender(
      <TenantsSearch listQuery={mockTenantsListQuery({ search })} />,
    );
  };

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    replace = mockLocaleRouter().replace;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('with no search applied', () => {
    beforeEach(() => {
      view = setup();
    });

    it('searches for the typed text once typing pauses', async () => {
      const search = getSearch();
      await user.type(search, MOCK_TENANT_SLUG);
      expect(replace).not.toHaveBeenCalled();

      await waitOutDebounce();

      expect(replace).toHaveBeenCalledOnce();
      expect(replace).toHaveBeenCalledWith(SEARCH_URL);
    });

    it('searches at once when Enter is pressed, ignoring surrounding spaces', async () => {
      const search = getSearch();
      await user.type(search, `  ${MOCK_TENANT_SLUG} {Enter}`);
      await waitOutDebounce();

      expect(replace).toHaveBeenCalledOnce();
      expect(replace).toHaveBeenCalledWith(SEARCH_URL);
    });

    it('offers no clear button while the field is empty', () => {
      const clear = screen.queryByRole('button', { name: CLEAR_LABEL });

      expect(clear).not.toBeInTheDocument();
    });

    it('keeps focus and the typed text when the results arrive', async () => {
      const search = getSearch();
      await user.type(search, `${MOCK_TENANT_SLUG}{Enter}`);
      showUrlSearch(MOCK_TENANT_SLUG);

      expect(search).toHaveFocus();
      expect(search).toHaveValue(MOCK_TENANT_SLUG);
    });

    it('keeps newer typing when an older search lands late', async () => {
      const search = getSearch();
      await user.type(search, FIRST_LETTER);
      await waitOutDebounce();
      await user.type(search, REST_OF_SLUG);
      await waitOutDebounce();

      showUrlSearch(FIRST_LETTER);
      expect(search).toHaveValue(MOCK_TENANT_SLUG);

      showUrlSearch(MOCK_TENANT_SLUG);
      expect(search).toHaveValue(MOCK_TENANT_SLUG);
    });

    it('shows the search the URL changes to when the field did not request it', () => {
      showUrlSearch(MOCK_TENANT_SLUG);

      expect(getSearch()).toHaveValue(MOCK_TENANT_SLUG);
    });

    it('keeps a sort made while the search is pending', async () => {
      const search = getSearch();
      await user.type(search, MOCK_TENANT_SLUG);
      view.rerender(
        <TenantsSearch
          listQuery={mockTenantsListQuery({
            sort: {
              column: TENANT_SORT_COLUMN.NAME,
              direction: SORT_DIRECTION.ASCENDING,
            },
          })}
        />,
      );
      await waitOutDebounce();

      expect(replace).toHaveBeenCalledWith(
        `/tenants?sort=NAME&direction=ascending&q=${MOCK_TENANT_SLUG}`,
      );
    });
  });

  describe('with a search applied', () => {
    beforeEach(() => {
      view = setup({
        listQuery: mockTenantsListQuery({ search: MOCK_TENANT_SLUG }),
      });
    });

    it('sends no search when only surrounding spaces change', async () => {
      const search = getSearch();
      await user.type(search, ' ');
      await waitOutDebounce();

      expect(replace).not.toHaveBeenCalled();
    });

    it('searches again when Enter is pressed on the unchanged text', async () => {
      const search = getSearch();
      await user.type(search, '{Enter}');

      expect(replace).toHaveBeenCalledWith(SEARCH_URL);
    });

    it('clears the search and keeps focus in the field', async () => {
      const clear = screen.getByRole('button', { name: CLEAR_LABEL });
      await user.click(clear);

      const search = getSearch();
      expect(search).toHaveValue('');
      expect(search).toHaveFocus();
      expect(replace).toHaveBeenCalledWith('/tenants');
    });
  });

  it('keeps the archived filter when searching', async () => {
    setup({ listQuery: mockTenantsListQuery({ shouldShowArchived: true }) });

    const search = getSearch();
    await user.type(search, `${MOCK_TENANT_SLUG}{Enter}`);

    expect(replace).toHaveBeenCalledWith(
      `/tenants?archived=1&q=${MOCK_TENANT_SLUG}`,
    );
  });
});
