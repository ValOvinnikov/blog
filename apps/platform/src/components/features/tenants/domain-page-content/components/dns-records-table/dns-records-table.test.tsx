import { customRender, screen } from '@platform/testing/custom-render';
import { MOCK_VERCEL_A_RECORD } from '@platform/testing/tenants/fixtures';

import { DnsRecordsTable } from './dns-records-table';

const CNAME_TARGET = 'cname.vercel-dns.com';

const setup = customRender(DnsRecordsTable, {
  records: [
    { type: 'A', name: '@', value: MOCK_VERCEL_A_RECORD },
    { type: 'CNAME', name: 'www', value: CNAME_TARGET },
  ],
});

describe(`<${DnsRecordsTable.name}/>`, () => {
  it('shows the type, name and value columns', () => {
    setup();

    const typeHeader = screen.getByRole('columnheader', { name: 'Type' });
    const nameHeader = screen.getByRole('columnheader', { name: 'Name' });
    const valueHeader = screen.getByRole('columnheader', { name: 'Value' });

    expect(typeHeader).toBeVisible();
    expect(nameHeader).toBeVisible();
    expect(valueHeader).toBeVisible();
  });

  it('renders one row per record beneath the header row', () => {
    setup();

    const rows = screen.getAllByRole('row');
    const aRecord = screen.getByText(MOCK_VERCEL_A_RECORD);
    const cnameRecord = screen.getByText(CNAME_TARGET);

    expect(rows).toHaveLength(3);
    expect(aRecord).toBeVisible();
    expect(cnameRecord).toBeVisible();
  });

  it('renders only the header row for no records', () => {
    setup({ records: [] });

    const rows = screen.getAllByRole('row');

    expect(rows).toHaveLength(1);
  });
});
