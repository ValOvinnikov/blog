import { countMembershipsOverSeats } from '@blog/db/queries/memberships';

import { findGraceLocks, findSubdomain, hasGraceLocks } from './grace-locks';

vi.mock('@blog/db/queries/memberships', () => ({
  countMembershipsOverSeats: vi.fn(),
}));

const countMembershipsOverSeatsMock = vi.mocked(countMembershipsOverSeats);

const MOCK_TENANT_ID = 'tenant-grace-locks';
const MOCK_ROOT_DOMAIN = 'example.com';
const MOCK_SUBDOMAIN = `northwind.${MOCK_ROOT_DOMAIN}`;
const MOCK_CUSTOM_DOMAIN = 'northwind.example.dev';
const MOCK_HOSTS = [MOCK_CUSTOM_DOMAIN, MOCK_SUBDOMAIN];
const MOCK_SEATS = 1;
const MOCK_LOCKED_MEMBER_COUNT = 2;
const WITHOUT_CUSTOM_DOMAIN = { seats: MOCK_SEATS, hasCustomDomain: false };
const ON_CUSTOM_DOMAIN = {
  id: MOCK_TENANT_ID,
  primaryDomain: MOCK_CUSTOM_DOMAIN,
};

describe(findGraceLocks, () => {
  beforeEach(() => {
    countMembershipsOverSeatsMock
      .mockReset()
      .mockResolvedValue(MOCK_LOCKED_MEMBER_COUNT);
  });

  it('counts the members past the seats and names the custom main address', async () => {
    const locks = await findGraceLocks(
      ON_CUSTOM_DOMAIN,
      WITHOUT_CUSTOM_DOMAIN,
      MOCK_HOSTS,
      MOCK_ROOT_DOMAIN,
    );

    expect(locks).toEqual({
      lockedMemberCount: MOCK_LOCKED_MEMBER_COUNT,
      customDomain: MOCK_CUSTOM_DOMAIN,
      subdomain: MOCK_SUBDOMAIN,
    });
    expect(countMembershipsOverSeatsMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_SEATS,
    );
  });

  it.each([
    [
      'the subdomain is the main address',
      { ...ON_CUSTOM_DOMAIN, primaryDomain: MOCK_SUBDOMAIN },
      WITHOUT_CUSTOM_DOMAIN,
    ],
    [
      'the plan includes a custom domain',
      ON_CUSTOM_DOMAIN,
      { seats: MOCK_SEATS, hasCustomDomain: true },
    ],
  ])('names no custom domain when %s', async (_, tenant, entitlements) => {
    const locks = await findGraceLocks(
      tenant,
      entitlements,
      MOCK_HOSTS,
      MOCK_ROOT_DOMAIN,
    );

    expect(locks.customDomain).toBeUndefined();
  });
});

describe(findSubdomain, () => {
  it('finds the host under the root domain', () => {
    expect(findSubdomain(MOCK_HOSTS, MOCK_ROOT_DOMAIN)).toBe(MOCK_SUBDOMAIN);
  });

  it('finds none when no host is under the root domain', () => {
    expect(
      findSubdomain([MOCK_CUSTOM_DOMAIN], MOCK_ROOT_DOMAIN),
    ).toBeUndefined();
  });
});

describe(hasGraceLocks, () => {
  const NO_LOCKS = {
    lockedMemberCount: 0,
    customDomain: undefined,
    subdomain: MOCK_SUBDOMAIN,
  };

  it.each([
    [
      'members are over the seats',
      { ...NO_LOCKS, lockedMemberCount: MOCK_LOCKED_MEMBER_COUNT },
      true,
    ],
    [
      'a custom domain is the main address',
      { ...NO_LOCKS, customDomain: MOCK_CUSTOM_DOMAIN },
      true,
    ],
    ['nothing locks', NO_LOCKS, false],
  ])('reports whether anything locks when %s', (_, locks, expected) => {
    expect(hasGraceLocks(locks)).toBe(expected);
  });
});
