import { SORT_DIRECTION } from '@blog/config/constants';
import { faker } from '@faker-js/faker';
import {
  DATA_REQUEST_MATCH_KIND,
  DATA_REQUEST_MATCHES_PAGE_SIZE,
} from '@platform/constants/data-request';
import messages from '@platform/i18n/messages/en.json';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { mockDataRequestMatch } from '@platform/testing/data-requests/fixtures';
import { makeEnTranslator } from '@platform/testing/en-translator';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { DataRequestMatchesTable } from './data-request-matches-table';

faker.seed(5967);

const { dataRequestMatchesTable, dataRequestMatchKind, pagination } = messages;
const t = makeEnTranslator();

const MS_PER_DAY = 86_400_000;
const EXTRA_ROWS = 5;
const NEWEST_RECORDED_AT = faker.date.recent();
const SITE_NAMES = Array.from(
  { length: DATA_REQUEST_MATCHES_PAGE_SIZE + EXTRA_ROWS },
  () => `${faker.company.name()} ${faker.string.uuid()}`,
);
const MATCHES = SITE_NAMES.map((siteName, daysAgo) =>
  mockDataRequestMatch({
    key: faker.string.uuid(),
    kind:
      daysAgo === SITE_NAMES.length - 1
        ? DATA_REQUEST_MATCH_KIND.LEAD
        : DATA_REQUEST_MATCH_KIND.SUBSCRIBER,
    siteName,
    recordedAt: new Date(NEWEST_RECORDED_AT.getTime() - daysAgo * MS_PER_DAY),
  }),
);
const NEWEST_SITE_NAME = SITE_NAMES.at(0) ?? '';
const OLDEST_SITE_NAME = SITE_NAMES.at(-1) ?? '';

const RECORDED_COLUMN = { name: dataRequestMatchesTable.columnRecorded };
const SITE_COLUMN = { name: dataRequestMatchesTable.columnSite };
const RESULTS_TABLE = { name: dataRequestMatchesTable.regionLabel };

const SEARCH_FIELD = { name: dataRequestMatchesTable.searchLabel };
const KIND_FILTER = { name: dataRequestMatchesTable.kindFilterLabel };
const LEAD_OPTION = { name: dataRequestMatchKind.LEAD };
const NEXT_BUTTON = { name: pagination.next };

const setup = customRender(DataRequestMatchesTable, { matches: MATCHES });

const bodyRows = () => {
  const table = screen.getByRole('region', RESULTS_TABLE);
  const [, ...rows] = within(table).getAllByRole('row');
  return rows;
};

describe(`<${DataRequestMatchesTable.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    setup();
  });

  it('shows one page of rows, newest first', () => {
    const rows = bodyRows();
    const [firstRow] = rows;
    const recordedHeader = screen.getByRole('columnheader', RECORDED_COLUMN);

    expect(rows).toHaveLength(DATA_REQUEST_MATCHES_PAGE_SIZE);
    expect(firstRow).toHaveTextContent(NEWEST_SITE_NAME);
    expect(recordedHeader).toHaveAttribute(
      'aria-sort',
      SORT_DIRECTION.DESCENDING,
    );
  });

  it('pages through the rest', async () => {
    const nextButton = screen.getByRole('button', NEXT_BUTTON);
    await user.click(nextButton);

    const rows = bodyRows();
    const status = screen.getByText(
      t('pagination.status', { page: 2, totalPages: 2 }),
    );

    expect(rows).toHaveLength(EXTRA_ROWS);
    expect(status).toBeVisible();
  });

  it('sorts oldest first when the recorded header is clicked', async () => {
    const recordedSort = screen.getByRole('button', RECORDED_COLUMN);
    await user.click(recordedSort);

    const [firstRow] = bodyRows();

    expect(firstRow).toHaveTextContent(OLDEST_SITE_NAME);
  });

  it('sorts by site when its header is clicked', async () => {
    const siteSort = screen.getByRole('button', SITE_COLUMN);
    await user.click(siteSort);

    const siteHeader = screen.getByRole('columnheader', SITE_COLUMN);
    const [firstRow] = bodyRows();
    const [firstSite] = SITE_NAMES.toSorted(
      new Intl.Collator('en', { sensitivity: 'base' }).compare,
    );

    expect(siteHeader).toHaveAttribute('aria-sort', SORT_DIRECTION.ASCENDING);
    expect(firstRow).toHaveTextContent(firstSite ?? '');
  });

  it('narrows the rows to those matching the search', async () => {
    const searchField = screen.getByRole('searchbox', SEARCH_FIELD);
    await user.type(searchField, OLDEST_SITE_NAME);

    const rows = bodyRows();
    const [onlyRow] = rows;

    expect(rows).toHaveLength(1);
    expect(onlyRow).toHaveTextContent(dataRequestMatchKind.LEAD);
  });

  it('shows only the chosen kind', async () => {
    const kindFilter = screen.getByRole('combobox', KIND_FILTER);
    await user.click(kindFilter);
    const leadOption = await screen.findByRole('option', LEAD_OPTION);
    await user.click(leadOption);

    const rows = bodyRows();

    expect(rows).toHaveLength(1);
  });

  it('says so when nothing matches the search', async () => {
    const searchField = screen.getByRole('searchbox', SEARCH_FIELD);
    await user.type(searchField, faker.string.uuid());

    const noResults = screen.getByText(dataRequestMatchesTable.noResults);

    expect(noResults).toBeVisible();
  });
});
