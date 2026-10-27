import { faker } from '@faker-js/faker';
import { customRender, screen } from '@platform/testing/custom-render';

import { BrandMark } from './brand-mark';

faker.seed(5995);

const ARIA_HIDDEN = 'aria-hidden';
const BRAND_GLYPH = 'V';
const MOCK_TITLE = faker.company.name();

const setup = customRender(BrandMark, {});

describe(`<${BrandMark.name}/>`, () => {
  describe('without a title', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the glyph', () => {
      const glyph = screen.getByText(BRAND_GLYPH);

      expect(glyph).toBeVisible();
    });

    it('is hidden from assistive technology', () => {
      const mark = screen.getByText(BRAND_GLYPH);

      expect(mark).toHaveAttribute(ARIA_HIDDEN, 'true');
    });
  });

  describe('with a title', () => {
    beforeEach(() => {
      setup({ title: MOCK_TITLE });
    });

    it('exposes an image named by the title', () => {
      const mark = screen.getByRole('img', { name: MOCK_TITLE });

      expect(mark).toBeVisible();
    });

    it('is no longer hidden from assistive technology', () => {
      const mark = screen.getByRole('img', { name: MOCK_TITLE });

      expect(mark).not.toHaveAttribute(ARIA_HIDDEN);
    });
  });
});
