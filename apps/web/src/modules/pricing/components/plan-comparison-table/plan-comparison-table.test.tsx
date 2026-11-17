import {
  PLAN_COMPARISON_ANCHOR_ID,
  SITE_MESSAGES,
  TENANT_PLAN,
} from '@shinefold/config';
import type * as TDbConstants from '@shinefold/db/constants';
import { PLAN_COMPARISON_ROW } from '@web/constants/pricing';
import { customRender, screen, within } from '@web/testing/custom-render';

import { PlanComparisonTable } from './plan-comparison-table';

const { MOCK_GROWTH_LANGUAGES } = await vi.hoisted(async () => {
  const { faker } = await import('@faker-js/faker');
  faker.seed(31);
  return { MOCK_GROWTH_LANGUAGES: faker.number.int({ min: 4, max: 9 }) };
});

vi.mock('@shinefold/db/constants', async (importOriginal) => {
  const actual = await importOriginal<typeof TDbConstants>();
  const { TENANT_PLAN } = await import('@shinefold/config/constants');
  return {
    ...actual,
    PLAN_LOCALE_LIMIT: {
      ...actual.PLAN_LOCALE_LIMIT,
      [TENANT_PLAN.GROWTH]: MOCK_GROWTH_LANGUAGES,
    },
  };
});

const COMPARE_MESSAGES = SITE_MESSAGES.pricingModule.compare;

const setup = customRender(PlanComparisonTable, {});

const rowFor = (row: keyof typeof COMPARE_MESSAGES.rows) =>
  screen.getByRole('row', { name: new RegExp(COMPARE_MESSAGES.rows[row]) });

describe(`<${PlanComparisonTable.name}/>`, () => {
  beforeEach(() => {
    setup();
  });

  it('names the scrolling table region after its heading', () => {
    const region = screen.getByRole('region', {
      name: COMPARE_MESSAGES.heading,
    });

    expect(region).toBeVisible();
  });

  it('anchors the heading for links to the comparison', () => {
    const heading = screen.getByRole('heading', {
      name: COMPARE_MESSAGES.heading,
    });

    expect(heading).toHaveAttribute('id', PLAN_COMPARISON_ANCHOR_ID);
  });

  it.each(Object.values(TENANT_PLAN))('gives %s a column', (plan) => {
    const header = screen.getByRole('columnheader', {
      name: COMPARE_MESSAGES.plans[plan],
    });

    expect(header).toBeVisible();
  });

  it("shows a plan's language limit from the plan record", () => {
    const row = rowFor(PLAN_COMPARISON_ROW.LANGUAGES);
    const limit = within(row).getByText(String(MOCK_GROWTH_LANGUAGES));

    expect(limit).toBeInTheDocument();
  });

  it('announces whether a plan includes a feature', () => {
    const row = rowFor(PLAN_COMPARISON_ROW.CONTACT_FORM);
    const notIncluded = within(row).getByText(COMPARE_MESSAGES.notIncluded);
    const included = within(row).getAllByText(COMPARE_MESSAGES.included);

    expect(notIncluded).toBeInTheDocument();
    expect(included).not.toHaveLength(0);
  });
});
