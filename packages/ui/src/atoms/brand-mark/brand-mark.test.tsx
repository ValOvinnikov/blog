import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { BrandMark } from './brand-mark';

faker.seed(123);

const setup = customRender(BrandMark, {});

describe(`<${BrandMark.name}/>`, () => {
  it('renders three polygon layers', () => {
    const { container } = setup();
    expect(container.querySelectorAll('polygon')).toHaveLength(3);
  });

  it('is decorative by default — no accessible role or name', () => {
    setup();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('exposes an accessible name when a title is provided', () => {
    const title = faker.company.name();
    setup({ title });
    expect(screen.getByRole('img', { name: title })).toBeVisible();
  });

  it('fills layers from the logo tokens', () => {
    const { container } = setup();
    const polygons = container.querySelectorAll('polygon');
    expect(polygons[0]).toHaveStyle({ fill: 'var(--logo-1)' });
    expect(polygons[1]).toHaveStyle({ fill: 'var(--logo-2)' });
    expect(polygons[2]).toHaveStyle({ fill: 'var(--logo-3)' });
  });
});
