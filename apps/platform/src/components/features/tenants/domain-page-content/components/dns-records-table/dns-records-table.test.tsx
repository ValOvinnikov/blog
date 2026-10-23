import { renderWithIntl, screen } from '@platform/testing/custom-render';
import { MOCK_VERCEL_A_RECORD } from '@platform/testing/tenants/fixtures';

import { DnsRecordsTable } from './dns-records-table';

const render = renderWithIntl;
const CNAME_TARGET = 'cname.vercel-dns.com';

describe(DnsRecordsTable, () => {
  it('renders one row per record, with type/name/value columns', () => {
    render(
      <DnsRecordsTable
        records={[
          { type: 'A', name: '@', value: MOCK_VERCEL_A_RECORD },
          { type: 'CNAME', name: 'www', value: CNAME_TARGET },
        ]}
      />,
    );

    expect(screen.getByRole('columnheader', { name: 'Type' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Value' })).toBeVisible();

    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByText(MOCK_VERCEL_A_RECORD)).toBeVisible();
    expect(screen.getByText(CNAME_TARGET)).toBeVisible();
  });

  it('renders an empty table body for no records', () => {
    render(<DnsRecordsTable records={[]} />);

    expect(screen.getAllByRole('row')).toHaveLength(1);
  });
});
