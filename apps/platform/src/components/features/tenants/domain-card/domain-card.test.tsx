import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { customRender, screen } from '@platform/testing/custom-render';
import {
  mockTenant,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
} from '@platform/testing/tenants/fixtures';
import { adminRoutes } from '@platform/utils/routes/routes';

import { DomainCard } from './domain-card';

const TENANT_DNS_HREF = adminRoutes.tenantDomain(MOCK_TENANT_ID);
const OWNER_DNS_HREF = adminRoutes.dashboardDomain();

const setup = customRender(DomainCard, {
  tenant: mockTenant(),
  domainVerificationStatus: DOMAIN_VERIFICATION_STATUS.VERIFIED,
  dnsHref: TENANT_DNS_HREF,
});

describe(`<${DomainCard.name}/>`, () => {
  it('shows the public domain and a link to the given DNS href', () => {
    setup();

    const domain = screen.getByText(MOCK_TENANT_DOMAIN);
    const dnsLink = screen.getByRole('link', { name: 'DNS' });

    expect(domain).toBeVisible();
    expect(dnsLink).toHaveAttribute('href', TENANT_DNS_HREF);
  });

  it("links to the owner tree's domain page when given that href instead", () => {
    setup({ dnsHref: OWNER_DNS_HREF });

    const dnsLink = screen.getByRole('link', { name: 'DNS' });

    expect(dnsLink).toHaveAttribute('href', OWNER_DNS_HREF);
  });

  it("nests the card's title one level under the page's own h1", () => {
    setup({
      domainVerificationStatus: DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED,
    });

    const heading = screen.getByRole('heading', { level: 2, name: 'Domain' });

    expect(heading).toBeVisible();
  });

  it.each([
    [DOMAIN_VERIFICATION_STATUS.VERIFIED, 'Verified'],
    [DOMAIN_VERIFICATION_STATUS.PENDING, 'Pending — awaiting DNS'],
    [DOMAIN_VERIFICATION_STATUS.NOT_ADDED, 'Not added yet'],
    [DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED, 'Unavailable'],
    [DOMAIN_VERIFICATION_STATUS.ERROR, "Couldn't check"],
  ])('leads its rows with a %s Status row reading "%s"', (status, text) => {
    setup({ domainVerificationStatus: status });

    const [firstTerm] = screen.getAllByRole('term');
    const [firstDefinition] = screen.getAllByRole('definition');

    expect(firstTerm).toHaveTextContent('Status');
    expect(firstDefinition).toHaveTextContent(text);
  });

  it.each([
    DOMAIN_VERIFICATION_STATUS.NOT_ADDED,
    DOMAIN_VERIFICATION_STATUS.PENDING,
    DOMAIN_VERIFICATION_STATUS.VERIFIED,
  ])('claims a recent check for a %s status Vercel reported', (status) => {
    setup({ domainVerificationStatus: status });

    const checkedAt = screen.getByText('Just now');

    expect(checkedAt).toBeVisible();
  });

  it.each([
    DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED,
    DOMAIN_VERIFICATION_STATUS.ERROR,
  ])('claims no recent check for a %s status', (status) => {
    setup({ domainVerificationStatus: status });

    const lastCheckedLabel = screen.queryByText('Last checked');
    const checkedAt = screen.queryByText('Just now');

    expect(lastCheckedLabel).not.toBeInTheDocument();
    expect(checkedAt).not.toBeInTheDocument();
  });
});
