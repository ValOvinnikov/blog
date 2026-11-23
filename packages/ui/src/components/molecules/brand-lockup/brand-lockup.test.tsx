import { faker } from '@faker-js/faker';
import { customRender, screen } from '@shinefold/ui/testing/custom-render';
import {
  MOCK_SITE_INITIAL,
  MOCK_SITE_NAME,
} from '@shinefold/ui/testing/fixtures';

import { BrandLockup } from './brand-lockup';

faker.seed(123);

const MOCK_TAGLINE = faker.hacker.phrase();
const MOCK_SRC = faker.image.url();
const MOCK_DARK_SRC = faker.image.url();

const setup = customRender(BrandLockup, {});

describe(`<${BrandLockup.name}/>`, () => {
  it('renders an uploaded image mark when src is provided', () => {
    setup({ src: MOCK_SRC });

    const mark = screen.getByRole('presentation');

    expect(mark).toHaveAttribute('src', MOCK_SRC);
  });

  it('renders the dark-mode logo beside the main logo when both are given', () => {
    setup({ src: MOCK_SRC, darkSrc: MOCK_DARK_SRC });

    const marks = screen.getAllByRole('presentation');

    expect(marks.map((mark) => mark.getAttribute('src'))).toEqual([
      MOCK_SRC,
      MOCK_DARK_SRC,
    ]);
  });

  it('falls back to the initial tile when only a dark-mode logo is given', () => {
    setup({ siteName: MOCK_SITE_NAME, darkSrc: MOCK_DARK_SRC });

    const image = screen.queryByRole('presentation');
    const initial = screen.getByText(MOCK_SITE_INITIAL);

    expect(image).not.toBeInTheDocument();
    expect(initial).toBeInTheDocument();
  });

  it('passes the site name to the mark', () => {
    setup({ siteName: MOCK_SITE_NAME });

    const initial = screen.getByText(MOCK_SITE_INITIAL);

    expect(initial).toBeInTheDocument();
  });

  describe('with the default props', () => {
    beforeEach(() => {
      setup();
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
