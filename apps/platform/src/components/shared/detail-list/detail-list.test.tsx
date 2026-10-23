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

    const domainLabel = screen.getByText('Public domain');
    const domainValue = screen.getByText(MOCK_CUSTOM_DOMAIN);
    const planLabel = screen.getByText('Plan');
    const planValue = screen.getByText('Growth');

    expect(domainLabel).toBeVisible();
    expect(domainValue).toBeVisible();
    expect(planLabel).toBeVisible();
    expect(planValue).toBeVisible();
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

    const dnsButton = screen.getByRole('button', { name: 'DNS' });

    expect(dnsButton).toBeVisible();
  });

  it('renders as a real definition list', () => {
    render(
      <DetailList>
        <DetailList.Row label="Locale">en</DetailList.Row>
      </DetailList>,
    );

    const label = screen.getByText('Locale');
    const value = screen.getByText('en');
    const definition = value.closest('dd');

    expect(label.tagName).toBe('DT');
    expect(value.tagName).toBe('SPAN');
    expect(definition).not.toBeNull();
  });
});
