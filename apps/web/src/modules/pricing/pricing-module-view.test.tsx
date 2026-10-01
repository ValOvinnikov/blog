import { BRAND_VARIANT, PRICE_PERIOD } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import type { IPricingCardData } from '@web/utils/to-pricing-panels';

import { PricingModuleView } from './pricing-module-view';

vi.mock('@web/i18n/navigation');

const makeCard = (
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
  headingBlock: makeHeadingBlock({ heading: 'Pricing' }),
  panels: [{ period: undefined, cards: [makeCard()] }],
  footnote: undefined,
  ctaButtons: [],
  contentAlignment: undefined,
  layout: undefined,
  titleId: 'pricing-title',
  dataTestId: 'pricing-module-pricing-1',
});

describe(`<${PricingModuleView.name}/>`, () => {
  it('renders a tier name and its formatted price', () => {
    setup();

    expect(screen.getByRole('heading', { name: 'Starter' })).toBeVisible();
    expect(screen.getByText('£49')).toBeVisible();
  });

  it('renders no period switch for a single panel', () => {
    setup();

    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
  });

  it('renders a period switch and shows only the monthly price', () => {
    setup({
      panels: [
        { period: PRICE_PERIOD.MONTH, cards: [makeCard()] },
        {
          period: PRICE_PERIOD.YEAR,
          cards: [
            makeCard({
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

    expect(screen.getByRole('radiogroup')).toBeVisible();
    expect(screen.getByText('£49')).toBeVisible();
    expect(screen.getByText('£490')).not.toBeVisible();
  });

  it('shows the label of a tier with no prices', () => {
    setup({
      panels: [
        {
          period: undefined,
          cards: [makeCard({ headline: undefined, label: 'Contact us' })],
        },
      ],
    });

    expect(screen.getByText('Contact us')).toBeVisible();
  });

  it('shows the badge of a highlighted tier', () => {
    setup({
      panels: [
        {
          period: undefined,
          cards: [makeCard({ highlightLabel: 'Most popular' })],
        },
      ],
    });

    expect(screen.getByText('Most popular')).toBeVisible();
  });

  it('renders extra price lines', () => {
    setup({
      panels: [
        {
          period: undefined,
          cards: [makeCard({ extras: ['£99 one-time'] })],
        },
      ],
    });

    expect(screen.getByText('£99 one-time')).toBeVisible();
  });

  it('renders the module footnote and actions', () => {
    setup({ footnote: 'Prices exclude VAT.', ctaButtons: ctaActionsDemo });

    expect(screen.getByText('Prices exclude VAT.')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Subscribe now' })).toBeVisible();
  });
});
