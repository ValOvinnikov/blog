import { BRAND_VARIANT, PRICE_PERIOD } from '@blog/config';
import { faker } from '@faker-js/faker';
import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_CTA_ACTIONS,
  MOCK_CTA_PRIMARY_ACTION,
} from '@web/testing/modules/cta/fixtures';
import { MOCK_PRICING_LABELS } from '@web/testing/modules/pricing/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import type { IPricingCardData } from '@web/utils/to-pricing-panels';

import { PricingModuleView } from './pricing-module-view';

vi.mock('@web/i18n/navigation');

faker.seed(11);

const MOCK_TIER_ID = faker.string.uuid();
const MOCK_TIER_NAME = faker.commerce.productName();
const MOCK_MONTHLY_PRICE = `£${faker.number.int({ min: 10, max: 99 })}`;
const MOCK_YEARLY_PRICE = `£${faker.number.int({ min: 100, max: 999 })}`;
const MOCK_PRICE_LABEL = faker.lorem.words(2);
const MOCK_HIGHLIGHT_LABEL = faker.lorem.words(2);
const MOCK_EXTRA_PRICE_LINE = faker.lorem.words(3);
const MOCK_FOOTNOTE = faker.lorem.sentence();
const MOCK_TITLE_ID = faker.lorem.slug();
const MOCK_DATA_TEST_ID = faker.lorem.slug();

const mockPricingCard = (
  overrides: Partial<IPricingCardData> = {},
): IPricingCardData => ({
  id: MOCK_TIER_ID,
  name: MOCK_TIER_NAME,
  description: undefined,
  headline: {
    amount: MOCK_MONTHLY_PRICE,
    compareAt: undefined,
    period: MOCK_PRICING_LABELS.periods[PRICE_PERIOD.MONTH],
    prefix: undefined,
  },
  label: undefined,
  extras: [],
  features: [],
  ctaButtons: [],
  highlightLabel: undefined,
  footnote: undefined,
  ...overrides,
});

const setup = customRender(PricingModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  headingBlock: mockHeadingBlock(),
  panels: [{ period: undefined, cards: [mockPricingCard()] }],
  footnote: undefined,
  ctaButtons: [],
  contentAlignment: undefined,
  layout: undefined,
  titleId: MOCK_TITLE_ID,
  dataTestId: MOCK_DATA_TEST_ID,
});

const setupWithCard = (overrides: Partial<IPricingCardData>) =>
  setup({
    panels: [{ period: undefined, cards: [mockPricingCard(overrides)] }],
  });

describe(`<${PricingModuleView.name}/>`, () => {
  describe('with the default panel', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a tier name and its formatted price', () => {
      const tierName = screen.getByRole('heading', { name: MOCK_TIER_NAME });
      const price = screen.getByText(MOCK_MONTHLY_PRICE);

      expect(tierName).toBeVisible();
      expect(price).toBeVisible();
    });

    it('renders no period switch for a single panel', () => {
      const periodSwitch = screen.queryByRole('radiogroup');

      expect(periodSwitch).not.toBeInTheDocument();
    });
  });

  it('renders a period switch and shows only the monthly price', () => {
    setup({
      panels: [
        { period: PRICE_PERIOD.MONTH, cards: [mockPricingCard()] },
        {
          period: PRICE_PERIOD.YEAR,
          cards: [
            mockPricingCard({
              headline: {
                amount: MOCK_YEARLY_PRICE,
                compareAt: undefined,
                period: MOCK_PRICING_LABELS.periods[PRICE_PERIOD.YEAR],
                prefix: undefined,
              },
            }),
          ],
        },
      ],
    });

    const periodSwitch = screen.getByRole('radiogroup');
    const monthlyPrice = screen.getByText(MOCK_MONTHLY_PRICE);
    const yearlyPrice = screen.getByText(MOCK_YEARLY_PRICE);

    expect(periodSwitch).toBeVisible();
    expect(monthlyPrice).toBeVisible();
    expect(yearlyPrice).not.toBeVisible();
  });

  it('shows the label of a tier with no prices', () => {
    setupWithCard({ headline: undefined, label: MOCK_PRICE_LABEL });

    const label = screen.getByText(MOCK_PRICE_LABEL);

    expect(label).toBeVisible();
  });

  it('shows the badge of a highlighted tier', () => {
    setupWithCard({ highlightLabel: MOCK_HIGHLIGHT_LABEL });

    const badge = screen.getByText(MOCK_HIGHLIGHT_LABEL);

    expect(badge).toBeVisible();
  });

  it('renders extra price lines', () => {
    setupWithCard({ extras: [MOCK_EXTRA_PRICE_LINE] });

    const extra = screen.getByText(MOCK_EXTRA_PRICE_LINE);

    expect(extra).toBeVisible();
  });

  it('renders the module footnote', () => {
    setup({ footnote: MOCK_FOOTNOTE });

    const footnote = screen.getByText(MOCK_FOOTNOTE);

    expect(footnote).toBeVisible();
  });

  it('renders the module actions', () => {
    setup({ ctaButtons: MOCK_CTA_ACTIONS });

    const action = screen.getByRole('link', {
      name: MOCK_CTA_PRIMARY_ACTION.link.label,
    });

    expect(action).toBeVisible();
  });
});
