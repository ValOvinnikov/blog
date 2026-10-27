import { CAPABILITY, type TCapability } from '@blog/config';
import type * as DbConstants from '@blog/db/constants';
import { TENANT_PLAN } from '@blog/db/constants';

import { planPageAccess, type TPlanPage } from './plan-page-access';

const { registry } = vi.hoisted(() => ({
  registry: {} as Record<string, TCapability[]>,
}));

vi.mock('@blog/db/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof DbConstants>()),
  PLAN_REGISTRY: registry,
}));

const withFreeCapabilities = (capabilities: TCapability[]) => {
  registry[TENANT_PLAN.FREE] = capabilities;
};

const CAPABILITY_GATED_PAGES: { page: TPlanPage; capability: TCapability }[] = [
  { page: 'leads', capability: CAPABILITY.CONTACT_FORM },
  { page: 'subscribers', capability: CAPABILITY.NEWSLETTER },
  { page: 'comments', capability: CAPABILITY.COMMENTS },
];

describe(planPageAccess, () => {
  beforeEach(() => {
    registry[TENANT_PLAN.FREE] = [
      CAPABILITY.RATINGS,
      CAPABILITY.CONSENT_BANNER,
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
      comments: false,
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
      comments: true,
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
});
