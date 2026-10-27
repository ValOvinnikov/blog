import { LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_PLAN } from '@blog/db';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import {
  mockTenant,
  MOCK_CUSTOM_DOMAIN,
  MOCK_SITE_NAME,
} from '@platform/testing/tenants/fixtures';

import { YourSiteCard } from './your-site-card';

const render = renderWithIntl;

describe(`<${YourSiteCard.name}/>`, () => {
  it('shows the name, public domain, plan and locale as plain values', () => {
    const tenant = mockTenant({
      name: MOCK_SITE_NAME,
      primaryDomain: MOCK_CUSTOM_DOMAIN,
      plan: TENANT_PLAN.GROWTH,
      locale: LOCALE_ISO_CODES.EN,
    });
    render(<YourSiteCard tenant={tenant} />);

    const name = screen.getByText(MOCK_SITE_NAME);
    const domain = screen.getByText(MOCK_CUSTOM_DOMAIN);
    const plan = screen.getByText('Growth');
    const locale = screen.getByText('English');
    const textbox = screen.queryByRole('textbox');

    expect(name).toBeVisible();
    expect(domain).toBeVisible();
    expect(plan).toBeVisible();
    expect(locale).toBeVisible();
    expect(textbox).not.toBeInTheDocument();
  });

  it('shows the public domain without a link and carries no read-only badge', () => {
    const tenant = mockTenant({ primaryDomain: MOCK_CUSTOM_DOMAIN });
    render(<YourSiteCard tenant={tenant} />);

    const link = screen.queryByRole('link');
    const badge = screen.queryByText('read-only');

    expect(link).not.toBeInTheDocument();
    expect(badge).not.toBeInTheDocument();
  });

  it("nests the card's title one level under the page's own h1", () => {
    render(<YourSiteCard tenant={mockTenant()} />);

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Your site',
    });

    expect(heading).toBeVisible();
  });
});
