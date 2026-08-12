import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { BrandLockup } from './brand-lockup';

faker.seed(123);

const setup = customRender(BrandLockup, {});

describe(`<${BrandLockup.name}/>`, () => {
  it('renders the polygon mark when no src is provided', () => {
    const { container } = setup();
    expect(container.querySelectorAll('polygon')).toHaveLength(3);
  });

  it('renders an uploaded image mark when src is provided', () => {
    const src = faker.image.url();
    const { container } = setup({ src });
    expect(container.querySelector('img')).toHaveAttribute('src', src);
    expect(container.querySelectorAll('polygon')).toHaveLength(0);
  });

  it('renders the mark decoratively — no accessible role or name', () => {
    setup();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('does not render a spec line by default', () => {
    const specLine = faker.hacker.phrase();
    setup();
    expect(screen.queryByText(specLine)).not.toBeInTheDocument();
  });

  it('renders the spec line when specLine is set', () => {
    const specLine = faker.hacker.phrase();
    setup({ specLine });
    expect(screen.getByText(specLine)).toBeVisible();
  });
});
