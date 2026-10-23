import { BRAND_VARIANT, PRICE_PERIOD } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_CTA_PRIMARY_ACTION,
  MOCK_CTA_ACTIONS,
} from '@web/testing/modules/cta/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import type { IPricingCardData } from '@web/utils/to-pricing-panels';

import { PricingModuleView } from './pricing-module-view';

vi.mock('@web/i18n/navigation');

const PRICE_LABEL = 'Contact us';
const HIGHLIGHT_LABEL = 'Most popular';
const EXTRA_PRICE_LINE = '£99 one-time';
const FOOTNOTE = 'Prices exclude VAT.';

const mockPricingCard = (
  overrides: Partial<IPricingCardData> = {},
): IPricingCardData => ({
  id: 'tier-1',
  name: 'Starter',
  description: undefined,
  headline: {
    amount: '£49',
    compareAt: undefined,
    period: 'per month',
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
  headingBlock: mockHeadingBlock({ heading: 'Pricing' }),
  panels: [{ period: undefined, cards: [mockPricingCard()] }],
  footnote: undefined,
  ctaButtons: [],
  contentAlignment: undefined,
  layout: undefined,
  titleId: 'pricing-title',
  dataTestId: 'pricing-module-pricing-1',
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
      const tierName = screen.getByRole('heading', { name: 'Starter' });
      const price = screen.getByText('£49');
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
                amount: '£490',
                compareAt: undefined,
                period: 'per year',
                prefix: undefined,
              },
            }),
          ],
        },
      ],
    });

    const periodSwitch = screen.getByRole('radiogroup');
    const monthlyPrice = screen.getByText('£49');
    const yearlyPrice = screen.getByText('£490');
    expect(periodSwitch).toBeVisible();
    expect(monthlyPrice).toBeVisible();
    expect(yearlyPrice).not.toBeVisible();
  });

  it('shows the label of a tier with no prices', () => {
    setupWithCard({ headline: undefined, label: PRICE_LABEL });

    const label = screen.getByText(PRICE_LABEL);
    expect(label).toBeVisible();
  });

  it('shows the badge of a highlighted tier', () => {
    setupWithCard({ highlightLabel: HIGHLIGHT_LABEL });

    const badge = screen.getByText(HIGHLIGHT_LABEL);
    expect(badge).toBeVisible();
  });

  it('renders extra price lines', () => {
    setupWithCard({ extras: [EXTRA_PRICE_LINE] });

    const extra = screen.getByText(EXTRA_PRICE_LINE);
    expect(extra).toBeVisible();
  });

  it('renders the module footnote and actions', () => {
    setup({ footnote: FOOTNOTE, ctaButtons: MOCK_CTA_ACTIONS });

    const footnote = screen.getByText(FOOTNOTE);
    const action = screen.getByRole('link', {
      name: MOCK_CTA_PRIMARY_ACTION.link.label,
    });
    expect(footnote).toBeVisible();
    expect(action).toBeVisible();
  });
});
