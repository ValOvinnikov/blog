import { render, screen } from '@platform/testing/custom-render';

import { DetailList } from './detail-list';

describe(DetailList, () => {
  it('renders each row as a label/value pair', () => {
    render(
      <DetailList>
        <DetailList.Row label="Public domain">northwind.dev</DetailList.Row>
        <DetailList.Row label="Plan">Growth</DetailList.Row>
      </DetailList>,
    );

    expect(screen.getByText('Public domain')).toBeVisible();
    expect(screen.getByText('northwind.dev')).toBeVisible();
    expect(screen.getByText('Plan')).toBeVisible();
    expect(screen.getByText('Growth')).toBeVisible();
  });

  it('renders a trailing action alongside the value', () => {
    render(
      <DetailList>
        <DetailList.Row
          label="Public domain"
          action={<button type="button">DNS</button>}
        >
          northwind.dev
        </DetailList.Row>
      </DetailList>,
    );

    expect(screen.getByRole('button', { name: 'DNS' })).toBeVisible();
  });

  it('renders as a real definition list', () => {
    render(
      <DetailList>
        <DetailList.Row label="Locale">en</DetailList.Row>
      </DetailList>,
    );

    expect(screen.getByText('Locale').tagName).toBe('DT');
    expect(screen.getByText('en').tagName).toBe('SPAN');
    expect(screen.getByText('en').closest('dd')).not.toBeNull();
  });
});
