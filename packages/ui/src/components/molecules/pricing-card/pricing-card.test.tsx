import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { PricingCard } from './pricing-card';

faker.seed(123);

const buildChildren = () => [
  <PricingCard.Name key="name">
    {faker.commerce.productName()}
  </PricingCard.Name>,
  <PricingCard.Price key="price" amount="$49" period="month" />,
];

const setup = customRender(PricingCard, {
  children: buildChildren(),
});

describe(`<${PricingCard.name}/>`, () => {
  it('renders the Name slot as a level-3 heading', () => {
    const name = faker.commerce.productName();
    setup({
      children: [
        <PricingCard.Name key="name">{name}</PricingCard.Name>,
        <PricingCard.Price key="price" amount="$49" />,
      ],
    });
    expect(screen.getByRole('heading', { level: 3, name })).toBeVisible();
  });

  it('shows the Badge when the card is highlighted', () => {
    setup({
      isHighlighted: true,
      children: [
        <PricingCard.Badge key="badge">Most popular</PricingCard.Badge>,
        ...buildChildren(),
      ],
    });
    expect(screen.getByText('Most popular')).toBeVisible();
  });

  it('does not render the Badge when the card is not highlighted', () => {
    setup({
      isHighlighted: false,
      children: [
        <PricingCard.Badge key="badge">Most popular</PricingCard.Badge>,
        ...buildChildren(),
      ],
    });
    expect(screen.queryByText('Most popular')).not.toBeInTheDocument();
  });

  it('does not render a Badge when isHighlighted is left at its default', () => {
    setup({
      children: [
        <PricingCard.Badge key="badge">Most popular</PricingCard.Badge>,
        ...buildChildren(),
      ],
    });
    expect(screen.queryByText('Most popular')).not.toBeInTheDocument();
  });

  it('announces a compareAt price as the regular price for assistive tech', () => {
    setup({
      children: [
        <PricingCard.Name key="name">
          {faker.commerce.productName()}
        </PricingCard.Name>,
        <PricingCard.Price
          key="price"
          amount="$39"
          compareAt="$49"
          period="month"
        />,
      ],
    });
    expect(screen.getByText('Regular price')).toBeInTheDocument();
    expect(screen.getByText('$49')).toBeVisible();
  });

  it('does not render compareAt markup when omitted', () => {
    setup();
    expect(screen.queryByText('Regular price')).not.toBeInTheDocument();
  });

  it('hides each feature check icon from assistive tech', () => {
    setup({
      children: [
        ...buildChildren(),
        <PricingCard.Features
          key="features"
          items={['Unlimited projects', 'Priority support']}
        />,
      ],
    });
    expect(screen.getByText('Unlimited projects')).toBeVisible();
    expect(screen.getByText('Priority support')).toBeVisible();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders the Description slot when provided', () => {
    const description = faker.commerce.productDescription();
    setup({
      children: [
        ...buildChildren(),
        <PricingCard.Description key="description">
          {description}
        </PricingCard.Description>,
      ],
    });
    expect(screen.getByText(description)).toBeVisible();
  });

  it('renders the Footnote slot when provided', () => {
    setup({
      children: [
        ...buildChildren(),
        <PricingCard.Footnote key="footnote">
          Billed annually
        </PricingCard.Footnote>,
      ],
    });
    expect(screen.getByText('Billed annually')).toBeVisible();
  });

  it('renders caller-supplied content inside the Actions slot', () => {
    setup({
      children: [
        ...buildChildren(),
        <PricingCard.Actions key="actions">
          <a href="/signup">Get started</a>
        </PricingCard.Actions>,
      ],
    });
    expect(screen.getByRole('link', { name: 'Get started' })).toBeVisible();
  });

  it('forwards data-testid to the root element', () => {
    setup({ dataTestId: 'pricing-card' });
    expect(screen.getByTestId('pricing-card')).toBeVisible();
  });
});
