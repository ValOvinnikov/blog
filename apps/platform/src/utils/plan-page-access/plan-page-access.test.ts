import { CAPABILITY, type TCapability } from '@blog/config';
import type * as DbConstants from '@blog/db/constants';
import { TENANT_PLAN } from '@blog/db/constants';

import { planPageAccess, type TPlanPage } from './plan-page-access';

const { registry } = vi.hoisted(() => ({
  registry: {} as Record<string, TCapability[]>,
}));

const { entitlements } = vi.hoisted(() => ({
  entitlements: {} as Record<string, { seats: number }>,
}));

vi.mock('@blog/db/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof DbConstants>()),
  PLAN_REGISTRY: registry,
  PLAN_ENTITLEMENTS: entitlements,
}));

const withFreeCapabilities = (capabilities: TCapability[]) => {
  registry[TENANT_PLAN.FREE] = capabilities;
};

const CAPABILITY_GATED_PAGES: { page: TPlanPage; capability: TCapability }[] = [
  { page: 'leads', capability: CAPABILITY.CONTACT_FORM },
  { page: 'subscribers', capability: CAPABILITY.NEWSLETTER },
];

describe(planPageAccess, () => {
  beforeEach(() => {
    entitlements[TENANT_PLAN.FREE] = { seats: 1 };
    entitlements[TENANT_PLAN.STARTER] = { seats: 1 };
    entitlements[TENANT_PLAN.GROWTH] = { seats: 3 };
    registry[TENANT_PLAN.FREE] = [
      CAPABILITY.RATINGS,
      CAPABILITY.CONSENT_BANNER,
    ];
    registry[TENANT_PLAN.STARTER] = [
      CAPABILITY.CONSENT_BANNER,
      CAPABILITY.CONTACT_FORM,
    ];
    registry[TENANT_PLAN.GROWTH] = [
      CAPABILITY.COMMENTS,
      CAPABILITY.RATINGS,
      CAPABILITY.BOOKMARKS,
      CAPABILITY.NEWSLETTER,
      CAPABILITY.ANALYTICS,
      CAPABILITY.CONSENT_BANNER,
      CAPABILITY.CONTACT_FORM,
    ];
  });

  it('gives a FREE tenant with no email capability none of the gated pages', () => {
    const access = planPageAccess(TENANT_PLAN.FREE);

    expect(access).toEqual({
      languages: false,
      email: false,
      leads: false,
      subscribers: false,
      team: false,
    });
  });

  it('gives a STARTER tenant the email and leads pages, without languages or team', () => {
    const access = planPageAccess(TENANT_PLAN.STARTER);

    expect(access).toEqual({
      languages: false,
      email: true,
      leads: true,
      subscribers: false,
      team: false,
    });
  });

  it('gives a GROWTH tenant every gated page', () => {
    const access = planPageAccess(TENANT_PLAN.GROWTH);

    expect(access).toEqual({
      languages: true,
      email: true,
      leads: true,
      subscribers: true,
      team: true,
    });
  });

  it.each(CAPABILITY_GATED_PAGES)(
    'opens $page when the plan holds $capability',
    ({ page, capability }) => {
      withFreeCapabilities([capability]);

      const access = planPageAccess(TENANT_PLAN.FREE);

      expect(access[page]).toBe(true);
    },
  );

  it.each(CAPABILITY_GATED_PAGES)(
    'keeps $page closed without $capability',
    ({ page }) => {
      withFreeCapabilities([CAPABILITY.RATINGS]);

      const access = planPageAccess(TENANT_PLAN.FREE);

      expect(access[page]).toBe(false);
    },
  );

  it.each([
    CAPABILITY.BOOKMARKS,
    CAPABILITY.COMMENTS,
    CAPABILITY.NEWSLETTER,
    CAPABILITY.CONTACT_FORM,
  ])('opens Email when the plan holds %s', (capability) => {
    withFreeCapabilities([capability]);

    const { email } = planPageAccess(TENANT_PLAN.FREE);

    expect(email).toBe(true);
  });

  it('keeps Languages and Team closed on FREE whatever its capabilities', () => {
    withFreeCapabilities([CAPABILITY.COMMENTS, CAPABILITY.NEWSLETTER]);

    const { languages, team } = planPageAccess(TENANT_PLAN.FREE);

    expect(languages).toBe(false);
    expect(team).toBe(false);
  });

  it('opens Team on any plan with more than one seat', () => {
    entitlements[TENANT_PLAN.FREE] = { seats: 2 };

    const { team } = planPageAccess(TENANT_PLAN.FREE);

    expect(team).toBe(true);
  });

  it('keeps Team closed on a one-seat plan', () => {
    entitlements[TENANT_PLAN.GROWTH] = { seats: 1 };

    const { team } = planPageAccess(TENANT_PLAN.GROWTH);

    expect(team).toBe(false);
  });
});
