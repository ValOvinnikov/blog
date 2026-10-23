import { render, screen } from '@platform/testing/custom-render';
import { MOCK_CUSTOM_DOMAIN } from '@platform/testing/tenants/fixtures';

import { DetailList } from './detail-list';

describe(`<${DetailList.name}/>`, () => {
  it('renders each row as a label/value pair', () => {
    render(
      <DetailList>
        <DetailList.Row label="Public domain">
          {MOCK_CUSTOM_DOMAIN}
        </DetailList.Row>
        <DetailList.Row label="Plan">Growth</DetailList.Row>
      </DetailList>,
    );

    expect(screen.getByText('Public domain')).toBeVisible();
    expect(screen.getByText(MOCK_CUSTOM_DOMAIN)).toBeVisible();
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
          {MOCK_CUSTOM_DOMAIN}
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
