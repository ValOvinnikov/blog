import { LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_PLAN } from '@blog/config/constants';
import { customRender, screen } from '@platform/testing/custom-render';
import {
  mockTenant,
  MOCK_CUSTOM_DOMAIN,
  MOCK_SITE_NAME,
} from '@platform/testing/tenants/fixtures';

import { YourSiteCard } from './your-site-card';

const setup = customRender(YourSiteCard, { tenant: mockTenant() });

const growthTenant = mockTenant({
  name: MOCK_SITE_NAME,
  primaryDomain: MOCK_CUSTOM_DOMAIN,
  plan: TENANT_PLAN.GROWTH,
  locale: LOCALE_ISO_CODES.EN,
});

describe(`<${YourSiteCard.name}/>`, () => {
  describe('for a Growth site on a custom domain', () => {
    beforeEach(() => {
      setup({ tenant: growthTenant });
    });

    it('shows the name, public domain, plan and locale as plain values', () => {
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

    it('shows the public domain without a link or read-only badge', () => {
      const link = screen.queryByRole('link');
      const badge = screen.queryByText('read-only');

      expect(link).not.toBeInTheDocument();
      expect(badge).not.toBeInTheDocument();
    });
  });

  describe('for the default site', () => {
    beforeEach(() => {
      setup();
    });

    it('labels the four values and ends with the read-only hint', () => {
      const terms = screen.getAllByRole('term');
      const hint = screen.getByText(/Need one of these changed\?/);

      expect(terms.map((term) => term.textContent)).toEqual([
        'Name',
        'Public domain',
        'Plan',
        'Language',
      ]);
      expect(hint).toBeVisible();
    });

    it("nests the card's title one level under the page's own h1", () => {
      const heading = screen.getByRole('heading', {
        level: 2,
        name: 'Your site',
      });

      expect(heading).toBeVisible();
    });
  });
});
