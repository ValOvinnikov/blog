import { renderWithIntl, screen } from '@admin/testing/custom-render';

import { DnsRecordsTable } from './dns-records-table';

const render = renderWithIntl;

describe(DnsRecordsTable, () => {
  it('renders one row per record, with type/name/value columns', () => {
    render(
      <DnsRecordsTable
        records={[
          { type: 'A', name: '@', value: '76.76.21.21' },
          { type: 'CNAME', name: 'www', value: 'cname.vercel-dns.com' },
        ]}
      />,
    );

    expect(screen.getByRole('columnheader', { name: 'Type' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Name' })).toBeVisible();
    expect(screen.getByRole('columnheader', { name: 'Value' })).toBeVisible();

    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByText('76.76.21.21')).toBeVisible();
    expect(screen.getByText('cname.vercel-dns.com')).toBeVisible();
  });

  it('renders an empty table body for no records', () => {
    render(<DnsRecordsTable records={[]} />);

    expect(screen.getAllByRole('row')).toHaveLength(1);
  });
});
