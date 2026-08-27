import { renderWithIntl, screen } from '@admin/testing/custom-render';
import { makeTenant } from '@admin/testing/tenants/fixtures';
import { TENANT_PLAN } from '@blog/db';

import { YourSiteCard } from './your-site-card';

const render = renderWithIntl;

describe(YourSiteCard, () => {
  it('shows the name, public domain, plan and locale as plain values', () => {
    const tenant = makeTenant({
      name: 'Northwind Field Notes',
      primaryDomain: 'northwind.dev',
      plan: TENANT_PLAN.GROWTH,
      locale: 'en',
    });
    render(<YourSiteCard tenant={tenant} />);

    expect(screen.getByText('Northwind Field Notes')).toBeVisible();
    expect(screen.getByText('northwind.dev')).toBeVisible();
    expect(screen.getByText('Growth')).toBeVisible();
    expect(screen.getByText('en')).toBeVisible();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('links the public domain out to the live site', () => {
    const tenant = makeTenant({ primaryDomain: 'northwind.dev' });
    render(<YourSiteCard tenant={tenant} />);

    expect(
      screen.getByRole('link', {
        name: 'Open northwind.dev in a new tab',
      }),
    ).toHaveAttribute('href', 'https://northwind.dev');
  });

  it("nests the card's title one level under the page's own h1", () => {
    render(<YourSiteCard tenant={makeTenant()} />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Your site' }),
    ).toBeVisible();
  });
});
