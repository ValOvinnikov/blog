import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { PricingCard } from './pricing-card';

faker.seed(123);

const MOCK_PRODUCT_NAME = faker.commerce.productName();
const MOCK_AMOUNT = `$${faker.number.int({ min: 10, max: 99 })}`;
const MOCK_COMPARE_AT = `$${faker.number.int({ min: 100, max: 199 })}`;
const MOCK_PERIOD = faker.lorem.words(2);
const MOCK_BADGE = faker.lorem.words(2);
const MOCK_FEATURES = faker.helpers.multiple(() => faker.lorem.words(2), {
  count: 2,
});
const MOCK_DESCRIPTION = faker.commerce.productDescription();
const MOCK_FOOTNOTE = faker.lorem.sentence();
const MOCK_ACTION_LABEL = faker.lorem.words(2);
const MOCK_ACTION_HREF = faker.internet.url();
const PRICE_TEST_ID = 'price';

const buildChildren = () => [
  <PricingCard.Name key="name">{MOCK_PRODUCT_NAME}</PricingCard.Name>,
  <PricingCard.Price key="price" amount={MOCK_AMOUNT} period={MOCK_PERIOD} />,
];

const setup = customRender(PricingCard, {
  children: buildChildren(),
});

describe(`<${PricingCard.name}/>`, () => {
  it('renders the Name slot as a level-3 heading', () => {
    setup();

    const heading = screen.getByRole('heading', {
      level: 3,
      name: MOCK_PRODUCT_NAME,
    });

    expect(heading).toBeVisible();
  });

  it('shows the Badge when the card is highlighted', () => {
    setup({
      isHighlighted: true,
      children: [
        <PricingCard.Badge key="badge">{MOCK_BADGE}</PricingCard.Badge>,
        ...buildChildren(),
      ],
    });

    const badge = screen.getByText(MOCK_BADGE);

    expect(badge).toBeVisible();
  });

  it.each([false, undefined])(
    'hides the Badge when the card is not highlighted (%s)',
    (isHighlighted) => {
      setup({
        isHighlighted,
        children: [
          <PricingCard.Badge key="badge">{MOCK_BADGE}</PricingCard.Badge>,
          ...buildChildren(),
        ],
      });

      const badge = screen.queryByText(MOCK_BADGE);

      expect(badge).not.toBeInTheDocument();
    },
  );

  it('announces a compareAt price with the label passed in', () => {
    const compareAtLabel = faker.lorem.words(2);
    setup({
      children: [
        ...buildChildren(),
        <PricingCard.Price
          key="compare-at"
          amount={MOCK_AMOUNT}
          compareAt={MOCK_COMPARE_AT}
          compareAtLabel={compareAtLabel}
        />,
      ],
    });

    const label = screen.getByText(compareAtLabel);
    const compareAt = screen.getByText(MOCK_COMPARE_AT);

    expect(label).toBeVisible();
    expect(compareAt).toBeVisible();
  });

  it('separates the amount and the period with a space', () => {
    setup({
      children: [
        <PricingCard.Price
          key="price"
          amount={MOCK_AMOUNT}
          period={MOCK_PERIOD}
          dataTestId={PRICE_TEST_ID}
        />,
      ],
    });

    const price = screen.getByTestId(PRICE_TEST_ID);

    expect(price).toHaveTextContent(`${MOCK_AMOUNT} ${MOCK_PERIOD}`);
  });

  it('renders the period exactly as passed', () => {
    setup({
      children: [
        <PricingCard.Price key="price" amount={MOCK_AMOUNT} period="/month" />,
      ],
    });

    const period = screen.getByText('/month');

    expect(period).toBeVisible();
  });

  it('lists the features without exposing a check icon to assistive tech', () => {
    setup({
      children: [
        ...buildChildren(),
        <PricingCard.Features key="features" items={MOCK_FEATURES} />,
      ],
    });

    const featureTexts = MOCK_FEATURES.map((feature) =>
      screen.getByText(feature),
    );
    const icon = screen.queryByRole('img');

    for (const featureText of featureTexts) {
      expect(featureText).toBeVisible();
    }
    expect(icon).not.toBeInTheDocument();
  });

  it('renders the Description slot', () => {
    setup({
      children: [
        ...buildChildren(),
        <PricingCard.Description key="description">
          {MOCK_DESCRIPTION}
        </PricingCard.Description>,
      ],
    });

    const description = screen.getByText(MOCK_DESCRIPTION);

    expect(description).toBeVisible();
  });

  it('renders the Footnote slot', () => {
    setup({
      children: [
        ...buildChildren(),
        <PricingCard.Footnote key="footnote">
          {MOCK_FOOTNOTE}
        </PricingCard.Footnote>,
      ],
    });

    const footnote = screen.getByText(MOCK_FOOTNOTE);

    expect(footnote).toBeVisible();
  });

  it('renders caller-supplied content inside the Actions slot', () => {
    setup({
      children: [
        ...buildChildren(),
        <PricingCard.Actions key="actions">
          <a href={MOCK_ACTION_HREF}>{MOCK_ACTION_LABEL}</a>
        </PricingCard.Actions>,
      ],
    });

    const actionLink = screen.getByRole('link', { name: MOCK_ACTION_LABEL });

    expect(actionLink).toBeVisible();
  });
});
