import { customRender, screen } from '@platform/testing/custom-render';
import { MOCK_VERCEL_A_RECORD } from '@platform/testing/tenants/fixtures';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { DnsRecordsTable } from './dns-records-table';

const CNAME_TARGET = 'cname.vercel-dns.com';
const APEX_NAME = '@';
const WWW_NAME = 'www';

const setup = customRender(DnsRecordsTable, {
  records: [
    { type: 'A', name: APEX_NAME, value: MOCK_VERCEL_A_RECORD },
    { type: 'CNAME', name: WWW_NAME, value: CNAME_TARGET },
  ],
});

describe(`<${DnsRecordsTable.name}/>`, () => {
  describe('with records', () => {
    let user: UserEvent;

    beforeEach(() => {
      user = userEvent.setup();
      setup();
    });

    it('shows the type, name and value columns', () => {
      const typeHeader = screen.getByRole('columnheader', { name: 'Type' });
      const nameHeader = screen.getByRole('columnheader', { name: 'Name' });
      const valueHeader = screen.getByRole('columnheader', { name: 'Value' });

      expect(typeHeader).toBeVisible();
      expect(nameHeader).toBeVisible();
      expect(valueHeader).toBeVisible();
    });

    it('renders one row per record beneath the header row', () => {
      const rows = screen.getAllByRole('row');
      const aRecord = screen.getByText(MOCK_VERCEL_A_RECORD);
      const cnameRecord = screen.getByText(CNAME_TARGET);

      expect(rows).toHaveLength(3);
      expect(aRecord).toBeVisible();
      expect(cnameRecord).toBeVisible();
    });

    it.each([
      ['Copy the A record name', APEX_NAME],
      ['Copy the A record value', MOCK_VERCEL_A_RECORD],
      ['Copy the CNAME record name', WWW_NAME],
      ['Copy the CNAME record value', CNAME_TARGET],
    ])('copies exactly the record text with %s', async (name, expected) => {
      const button = screen.getByRole('button', { name });
      await user.click(button);
      const clipboard = await navigator.clipboard.readText();

      expect(clipboard).toBe(expected);
    });
  });

  it('renders only the header row for no records', () => {
    setup({ records: [] });

    const rows = screen.getAllByRole('row');

    expect(rows).toHaveLength(1);
  });
});
