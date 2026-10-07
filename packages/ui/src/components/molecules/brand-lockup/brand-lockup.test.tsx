import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { BrandLockup } from './brand-lockup';

faker.seed(123);

const setup = customRender(BrandLockup, {});

describe(`<${BrandLockup.name}/>`, () => {
  let tagline: string;

  beforeEach(() => {
    tagline = faker.hacker.phrase();
  });

  it('renders an uploaded image mark when src is provided', () => {
    const src = faker.image.url();
    setup({ src });
    expect(screen.getByRole('presentation')).toHaveAttribute('src', src);
  });

  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the mark decoratively — no accessible role or name', () => {
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('does not render a tagline by default', () => {
      expect(screen.queryByText(tagline)).not.toBeInTheDocument();
    });
  });

  it('renders the tagline when tagline is set', () => {
    setup({ tagline });
    expect(screen.getByText(tagline)).toBeVisible();
  });
});
