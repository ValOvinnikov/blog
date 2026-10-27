import { faker } from '@faker-js/faker';
import {
  DATA_REQUEST_MATCH_KIND,
  DATA_REQUEST_MATCHES_PAGE_SIZE,
} from '@platform/constants/data-request';
import { SORT_DIRECTION } from '@platform/constants/sort';
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

const setup = customRender(DataRequestMatchesTable, { matches: MATCHES });

const bodyRows = () =>
  within(screen.getByRole('region', RESULTS_TABLE))
    .getAllByRole('row')
    .slice(1);

describe(`<${DataRequestMatchesTable.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    setup();
  });

  it('shows one page of rows, newest first', () => {
    const [firstRow] = bodyRows();
    const recordedHeader = screen.getByRole('columnheader', RECORDED_COLUMN);

    expect(bodyRows()).toHaveLength(DATA_REQUEST_MATCHES_PAGE_SIZE);
    expect(firstRow).toHaveTextContent(NEWEST_SITE_NAME);
    expect(recordedHeader).toHaveAttribute(
      'aria-sort',
      SORT_DIRECTION.DESCENDING,
    );
  });

  it('pages through the rest', async () => {
    await user.click(screen.getByRole('button', { name: pagination.next }));

    const status = screen.getByText(
      t('pagination.status', { page: 2, totalPages: 2 }),
    );

    expect(bodyRows()).toHaveLength(EXTRA_ROWS);
    expect(status).toBeVisible();
  });

  it('sorts oldest first when the recorded header is clicked', async () => {
    await user.click(screen.getByRole('button', RECORDED_COLUMN));

    const [firstRow] = bodyRows();

    expect(firstRow).toHaveTextContent(OLDEST_SITE_NAME);
  });

  it('sorts by site when its header is clicked', async () => {
    await user.click(screen.getByRole('button', SITE_COLUMN));

    const siteHeader = screen.getByRole('columnheader', SITE_COLUMN);
    const firstSite = SITE_NAMES.toSorted(
      new Intl.Collator('en', { sensitivity: 'base' }).compare,
    ).at(0);

    expect(siteHeader).toHaveAttribute('aria-sort', SORT_DIRECTION.ASCENDING);
    expect(bodyRows()[0]).toHaveTextContent(firstSite ?? '');
  });

  it('narrows the rows to those matching the search', async () => {
    await user.type(
      screen.getByRole('searchbox', {
        name: dataRequestMatchesTable.searchLabel,
      }),
      OLDEST_SITE_NAME,
    );

    const rows = bodyRows();

    expect(rows).toHaveLength(1);
    expect(rows[0]).toHaveTextContent(dataRequestMatchKind.LEAD);
  });

  it('shows only the chosen kind', async () => {
    await user.click(
      screen.getByRole('combobox', {
        name: dataRequestMatchesTable.kindFilterLabel,
      }),
    );
    await user.click(
      await screen.findByRole('option', { name: dataRequestMatchKind.LEAD }),
    );

    expect(bodyRows()).toHaveLength(1);
  });

  it('says so when nothing matches the search', async () => {
    await user.type(
      screen.getByRole('searchbox', {
        name: dataRequestMatchesTable.searchLabel,
      }),
      faker.string.uuid(),
    );

    const noResults = screen.getByText(dataRequestMatchesTable.noResults);

    expect(noResults).toBeVisible();
  });
});
