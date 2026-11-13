import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { BrandLockup } from './brand-lockup';

faker.seed(123);

const MOCK_TAGLINE = faker.hacker.phrase();
const MOCK_SRC = faker.image.url();
const MOCK_SITE_NAME = 'northern notes';
const MOCK_INITIAL = 'N';

const setup = customRender(BrandLockup, {});

describe(`<${BrandLockup.name}/>`, () => {
  it('renders an uploaded image mark when src is provided', () => {
    setup({ src: MOCK_SRC });

    const mark = screen.getByRole('presentation');

    expect(mark).toHaveAttribute('src', MOCK_SRC);
  });

  it('passes the site name to the mark', () => {
    setup({ siteName: MOCK_SITE_NAME });

    const initial = screen.getByText(MOCK_INITIAL);

    expect(initial).toBeInTheDocument();
  });

  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the mark decoratively with no accessible role or name', () => {
      const image = screen.queryByRole('img');

      expect(image).not.toBeInTheDocument();
    });

    it('does not render a tagline', () => {
      const tagline = screen.queryByText(MOCK_TAGLINE);

      expect(tagline).not.toBeInTheDocument();
    });
  });

  it('renders the tagline when one is given', () => {
    setup({ tagline: MOCK_TAGLINE });

    const tagline = screen.getByText(MOCK_TAGLINE);

    expect(tagline).toBeVisible();
  });
});
