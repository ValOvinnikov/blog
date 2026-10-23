import { LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_PLAN } from '@blog/db';
import { renderWithIntl, screen } from '@platform/testing/custom-render';
import {
  makeTenant,
  MOCK_CUSTOM_DOMAIN,
  MOCK_CUSTOM_DOMAIN_URL,
  MOCK_SITE_NAME,
} from '@platform/testing/tenants/fixtures';

import { YourSiteCard } from './your-site-card';

const render = renderWithIntl;

describe(`<${YourSiteCard.name}/>`, () => {
  it('shows the name, public domain, plan and locale as plain values', () => {
    const tenant = makeTenant({
      name: MOCK_SITE_NAME,
      primaryDomain: MOCK_CUSTOM_DOMAIN,
      plan: TENANT_PLAN.GROWTH,
      locale: LOCALE_ISO_CODES.EN,
    });
    render(<YourSiteCard tenant={tenant} />);

    expect(screen.getByText(MOCK_SITE_NAME)).toBeVisible();
    expect(screen.getByText(MOCK_CUSTOM_DOMAIN)).toBeVisible();
    expect(screen.getByText('Growth')).toBeVisible();
    expect(screen.getByText('English')).toBeVisible();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('links the public domain out to the live site', () => {
    const tenant = makeTenant({ primaryDomain: MOCK_CUSTOM_DOMAIN });
    render(<YourSiteCard tenant={tenant} />);

    expect(
      screen.getByRole('link', {
        name: `Open ${MOCK_CUSTOM_DOMAIN} in a new tab`,
      }),
    ).toHaveAttribute('href', MOCK_CUSTOM_DOMAIN_URL);
  });

  it("nests the card's title one level under the page's own h1", () => {
    render(<YourSiteCard tenant={makeTenant()} />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Your site' }),
    ).toBeVisible();
  });
});
