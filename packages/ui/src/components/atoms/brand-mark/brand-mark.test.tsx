import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { BrandMark } from './brand-mark';

faker.seed(123);

const setup = customRender(BrandMark, {});

describe(`<${BrandMark.name}/>`, () => {
  it('is decorative by default — no accessible role or name', () => {
    setup();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('exposes an accessible name when a title is provided', () => {
    const title = faker.company.name();
    setup({ title });
    expect(screen.getByRole('img', { name: title })).toBeVisible();
  });

  it('shows the uploaded image instead of the polygon mark when src is provided', () => {
    const src = faker.image.url();
    setup({ src });
    expect(screen.getByRole('presentation')).toHaveAttribute('src', src);
  });

  it('gives the image an empty alt when decorative (no title)', () => {
    const src = faker.image.url();
    setup({ src });
    expect(screen.getByRole('presentation')).toHaveAttribute('alt', '');
  });

  it('gives the image an accessible name when a title is provided', () => {
    const src = faker.image.url();
    const title = faker.company.name();
    setup({ src, title });
    expect(screen.getByRole('img', { name: title })).toBeVisible();
  });
});
