import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { customRender, screen } from '@platform/testing/custom-render';
import {
  makeTenant,
  MOCK_TENANT_DOMAIN,
  TENANT_ID,
} from '@platform/testing/tenants/fixtures';

import { DomainCard } from './domain-card';

const TENANT_DNS_HREF = `/tenants/${TENANT_ID}/domain`;
const OWNER_DNS_HREF = '/dashboard/domain';

const setup = customRender(DomainCard, {
  tenant: makeTenant(),
  domainVerificationStatus: DOMAIN_VERIFICATION_STATUS.VERIFIED,
  dnsHref: TENANT_DNS_HREF,
});

describe(`<${DomainCard.name}/>`, () => {
  it('shows the public domain and a link to the given DNS href', () => {
    setup();

    expect(screen.getByText(MOCK_TENANT_DOMAIN)).toBeVisible();
    expect(screen.getByRole('link', { name: 'DNS' })).toHaveAttribute(
      'href',
      TENANT_DNS_HREF,
    );
  });

  it("links to the owner tree's domain page when given that href instead", () => {
    setup({ dnsHref: OWNER_DNS_HREF });

    expect(screen.getByRole('link', { name: 'DNS' })).toHaveAttribute(
      'href',
      OWNER_DNS_HREF,
    );
  });

  it("nests the card's title one level under the page's own h1", () => {
    setup({
      domainVerificationStatus: DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED,
    });

    expect(
      screen.getByRole('heading', { level: 2, name: 'Domain' }),
    ).toBeVisible();
  });

  it.each([
    DOMAIN_VERIFICATION_STATUS.NOT_ADDED,
    DOMAIN_VERIFICATION_STATUS.PENDING,
    DOMAIN_VERIFICATION_STATUS.VERIFIED,
  ])('claims a recent check for a %s status Vercel reported', (status) => {
    setup({ domainVerificationStatus: status });

    expect(screen.getByText('Just now')).toBeVisible();
  });

  it.each([
    DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED,
    DOMAIN_VERIFICATION_STATUS.ERROR,
  ])('claims no recent check for a %s status', (status) => {
    setup({ domainVerificationStatus: status });

    expect(screen.queryByText('Last checked')).toBeNull();
    expect(screen.queryByText('Just now')).toBeNull();
  });
});
