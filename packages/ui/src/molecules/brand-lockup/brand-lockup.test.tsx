import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { BrandLockup } from './brand-lockup';

faker.seed(123);

const setup = customRender(BrandLockup, {});

describe(`<${BrandLockup.name}/>`, () => {
  it('renders the polygon mark when no src is provided', () => {
    setup();
    expect(screen.getAllByTestId('brand-mark-polygon')).toHaveLength(3);
  });

  it('renders an uploaded image mark when src is provided', () => {
    const src = faker.image.url();
    setup({ src });
    expect(screen.getByTestId('brand-mark-image')).toHaveAttribute('src', src);
    expect(screen.queryAllByTestId('brand-mark-polygon')).toHaveLength(0);
  });

  it('renders the mark decoratively — no accessible role or name', () => {
    setup();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('does not render a tagline by default', () => {
    const tagline = faker.hacker.phrase();
    setup();
    expect(screen.queryByText(tagline)).not.toBeInTheDocument();
  });

  it('renders the tagline when tagline is set', () => {
    const tagline = faker.hacker.phrase();
    setup({ tagline });
    expect(screen.getByText(tagline)).toBeVisible();
  });
});
