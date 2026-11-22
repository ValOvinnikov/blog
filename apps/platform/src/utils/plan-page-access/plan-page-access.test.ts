import { CAPABILITY, type TCapability } from '@shinefold/config';

import { entitlementPageAccess, type TPlanPage } from './plan-page-access';

const SINGLE = 1;
const SEVERAL = 3;

const entitledTo = ({
  capabilities = [],
  localeLimit = SINGLE,
  seats = SINGLE,
}: {
  capabilities?: TCapability[];
  localeLimit?: number;
  seats?: number;
}) => entitlementPageAccess({ capabilities, localeLimit, seats });

const CAPABILITY_GATED_PAGES: { page: TPlanPage; capability: TCapability }[] = [
  { page: 'leads', capability: CAPABILITY.CONTACT_FORM },
  { page: 'subscribers', capability: CAPABILITY.NEWSLETTER },
];

describe(entitlementPageAccess, () => {
  it('opens only Billing with one language, one seat and no email', () => {
    const access = entitledTo({ capabilities: [CAPABILITY.RATINGS] });

    expect(access).toEqual({
      languages: false,
      email: false,
      leads: false,
      subscribers: false,
      team: false,
      billing: true,
    });
  });

  it.each(CAPABILITY_GATED_PAGES)(
    'opens $page with $capability',
    ({ page, capability }) => {
      const access = entitledTo({ capabilities: [capability] });

      expect(access[page]).toBe(true);
    },
  );

  it.each(CAPABILITY_GATED_PAGES)(
    'keeps $page closed without it',
    ({ page }) => {
      const access = entitledTo({ capabilities: [CAPABILITY.RATINGS] });

      expect(access[page]).toBe(false);
    },
  );

  it.each([
    CAPABILITY.BOOKMARKS,
    CAPABILITY.COMMENTS,
    CAPABILITY.NEWSLETTER,
    CAPABILITY.CONTACT_FORM,
  ])('opens Email with %s', (capability) => {
    const { email } = entitledTo({ capabilities: [capability] });

    expect(email).toBe(true);
  });

  it.each([
    [SEVERAL, true],
    [SINGLE, false],
  ])('opens Languages with a limit of %i: %s', (localeLimit, isOpen) => {
    const { languages } = entitledTo({ localeLimit });

    expect(languages).toBe(isOpen);
  });

  it.each([
    [SEVERAL, true],
    [SINGLE, false],
  ])('opens Team with %i seats: %s', (seats, isOpen) => {
    const { team } = entitledTo({ seats });

    expect(team).toBe(isOpen);
  });
});
