import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';

import { BrandMark } from './brand-mark';

faker.seed(123);

describe(`<${BrandMark.name}/>`, () => {
  it('renders three polygon layers', () => {
    const { container } = render(<BrandMark />);
    expect(container.querySelectorAll('polygon')).toHaveLength(3);
  });

  it('is decorative by default — no accessible role or name', () => {
    render(<BrandMark />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('exposes an accessible name when a title is provided', () => {
    const title = faker.company.name();
    render(<BrandMark title={title} />);
    expect(screen.getByRole('img', { name: title })).toBeVisible();
  });

  it('fills layers from the Console tokens by default', () => {
    const { container } = render(<BrandMark />);
    const polygons = container.querySelectorAll('polygon');
    expect(polygons[0]).toHaveStyle({ fill: 'var(--logo-1)' });
    expect(polygons[1]).toHaveStyle({ fill: 'var(--logo-2)' });
    expect(polygons[2]).toHaveStyle({ fill: 'var(--logo-3)' });
  });

  it('fills layers from the Indigo tokens when variant is indigo', () => {
    const { container } = render(<BrandMark variant="indigo" />);
    const polygons = container.querySelectorAll('polygon');
    expect(polygons[0]).toHaveStyle({ fill: 'var(--logo-alt-1)' });
    expect(polygons[1]).toHaveStyle({ fill: 'var(--logo-alt-2)' });
    expect(polygons[2]).toHaveStyle({ fill: 'var(--logo-alt-3)' });
  });
});
