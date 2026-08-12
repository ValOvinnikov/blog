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

  it('renders an image and no polygon mark when src is provided', () => {
    const src = faker.image.url();
    const { container } = setup({ src });
    const image = container.querySelector('img');
    expect(image).toHaveAttribute('src', src);
    expect(container.querySelectorAll('polygon')).toHaveLength(0);
  });

  it('gives the image an empty alt when decorative (no title)', () => {
    const src = faker.image.url();
    const { container } = setup({ src });
    expect(container.querySelector('img')).toHaveAttribute('alt', '');
  });

  it('gives the image an accessible name when a title is provided', () => {
    const src = faker.image.url();
    const title = faker.company.name();
    setup({ src, title });
    expect(screen.getByRole('img', { name: title })).toBeVisible();
  });

  it('forwards passthrough props to the image the same as the svg mark', () => {
    const src = faker.image.url();
    const label = faker.lorem.words(2);
    const { container: svgContainer } = setup({ 'aria-label': label });
    expect(svgContainer.querySelector('svg')).toHaveAttribute(
      'aria-label',
      label,
    );

    const { container: imgContainer } = setup({ src, 'aria-label': label });
    expect(imgContainer.querySelector('img')).toHaveAttribute(
      'aria-label',
      label,
    );
  });
});
