import { CAPABILITY, type TCapability } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';

import { planPageAccess } from './plan-page-access';

const { registry } = vi.hoisted(() => ({
  registry: {} as Record<string, TCapability[]>,
}));

vi.mock('@blog/db/constants', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/db/constants')>()),
  PLAN_REGISTRY: registry,
}));

const withFreeCapabilities = (capabilities: TCapability[]) => {
  registry[TENANT_PLAN.FREE] = capabilities;
};

describe('planPageAccess', () => {
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
    ];
  });

  it('gives a FREE tenant with no email-sending capability none of the gated pages', () => {
    expect(planPageAccess(TENANT_PLAN.FREE)).toEqual({
      languages: false,
      email: false,
      subscribers: false,
      comments: false,
      team: false,
    });
  });

  it('gives a GROWTH tenant every gated page', () => {
    expect(planPageAccess(TENANT_PLAN.GROWTH)).toEqual({
      languages: true,
      email: true,
      subscribers: true,
      comments: true,
      team: true,
    });
  });

  it.each([CAPABILITY.BOOKMARKS, CAPABILITY.COMMENTS, CAPABILITY.NEWSLETTER])(
    'opens Email when the plan holds %s',
    (capability) => {
      withFreeCapabilities([capability]);

      expect(planPageAccess(TENANT_PLAN.FREE).email).toBe(true);
    },
  );

  it('opens Subscribers only with newsletter and Comments only with comments', () => {
    withFreeCapabilities([CAPABILITY.NEWSLETTER]);
    expect(planPageAccess(TENANT_PLAN.FREE)).toMatchObject({
      subscribers: true,
      comments: false,
    });

    withFreeCapabilities([CAPABILITY.COMMENTS]);
    expect(planPageAccess(TENANT_PLAN.FREE)).toMatchObject({
      subscribers: false,
      comments: true,
    });
  });

  it('keeps Languages and Team closed on FREE whatever its capabilities', () => {
    withFreeCapabilities([CAPABILITY.COMMENTS, CAPABILITY.NEWSLETTER]);

    expect(planPageAccess(TENANT_PLAN.FREE)).toMatchObject({
      languages: false,
      team: false,
    });
  });
});
