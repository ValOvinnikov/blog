import { TENANT_PLAN } from '@shinefold/config/constants';
import type * as TDbConstants from '@shinefold/db/constants';
import { PLAN_COMPARISON_ROW } from '@web/constants/pricing';

import { toPlanComparisonRows } from './to-plan-comparison-rows';

const { MOCK_GROWTH_SEATS } = await vi.hoisted(async () => {
  const { faker } = await import('@faker-js/faker');
  faker.seed(29);
  return { MOCK_GROWTH_SEATS: faker.number.int({ min: 4, max: 50 }) };
});

vi.mock('@shinefold/db/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof TDbConstants>();
  const { CAPABILITY, TENANT_PLAN } =
    await import('@shinefold/config/constants');
  return {
    ...actual,
    PLAN_REGISTRY: {
      ...actual.PLAN_REGISTRY,
      [TENANT_PLAN.STARTER]: [
        ...actual.PLAN_REGISTRY[TENANT_PLAN.FREE],
        CAPABILITY.NEWSLETTER,
      ],
    },
    PLAN_ENTITLEMENTS: {
      ...actual.PLAN_ENTITLEMENTS,
      [TENANT_PLAN.STARTER]: {
        ...actual.PLAN_ENTITLEMENTS[TENANT_PLAN.STARTER],
        modulePacks: actual.PLAN_ENTITLEMENTS[TENANT_PLAN.FREE].modulePacks,
      },
      [TENANT_PLAN.GROWTH]: {
        ...actual.PLAN_ENTITLEMENTS[TENANT_PLAN.GROWTH],
        seats: MOCK_GROWTH_SEATS,
        hasCustomDomain: false,
      },
    },
  };
});

const valuesOf = (row: string) =>
  toPlanComparisonRows().find((entry) => entry.row === row)?.values;

describe(toPlanComparisonRows, () => {
  it('gives one row per comparison row, in order', () => {
    const rows = toPlanComparisonRows().map(({ row }) => row);

    expect(rows).toStrictEqual(Object.values(PLAN_COMPARISON_ROW));
  });

  it("reads each plan's seats from its entitlements", () => {
    expect(valuesOf(PLAN_COMPARISON_ROW.SEATS)?.[TENANT_PLAN.GROWTH]).toBe(
      MOCK_GROWTH_SEATS,
    );
  });

  it("reads each plan's own-domain entitlement", () => {
    expect(
      valuesOf(PLAN_COMPARISON_ROW.CUSTOM_DOMAIN)?.[TENANT_PLAN.GROWTH],
    ).toBe(false);
  });

  it('gives no newsletter subscribers to a plan without the newsletter', () => {
    expect(
      valuesOf(PLAN_COMPARISON_ROW.NEWSLETTER_SUBSCRIBERS)?.[TENANT_PLAN.FREE],
    ).toBe(false);
  });

  it('counts a capability-gated section type only on a plan with its capability', () => {
    const sectionTypes = valuesOf(PLAN_COMPARISON_ROW.SECTION_TYPES);

    expect(sectionTypes?.[TENANT_PLAN.STARTER]).toBe(
      Number(sectionTypes?.[TENANT_PLAN.FREE]) + 1,
    );
  });
});
