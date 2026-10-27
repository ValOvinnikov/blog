import {
  BRAND_TAGLINE_SEPARATOR_CHARS,
  BRAND_TAGLINE_SEPARATORS,
} from '@blog/config';
import { customRender, screen } from '@blog/ui/testing/custom-render';
import {
  MOCK_FORMATTED_DATE,
  MOCK_PUBLISHED_AT,
} from '@blog/ui/testing/fixtures';
import { faker } from '@faker-js/faker';

import { CardMeta } from './card-meta';

faker.seed(123);

const MOCK_READING_TIME = `${faker.number.int({ min: 3, max: 15 })} min`;
const SEPARATOR = BRAND_TAGLINE_SEPARATOR_CHARS[BRAND_TAGLINE_SEPARATORS.DOT];

const setup = customRender(CardMeta, {
  dateValue: MOCK_PUBLISHED_AT,
  dateLabel: MOCK_FORMATTED_DATE,
});

describe(`<${CardMeta.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders the date as a time element', () => {
      const time = screen.getByRole('time');

      expect(time).toBeVisible();
      expect(time).toHaveAttribute('dateTime', MOCK_PUBLISHED_AT);
      expect(time).toHaveTextContent(MOCK_FORMATTED_DATE);
    });

    it('omits the reading time and its separator', () => {
      const separator = screen.queryByText(SEPARATOR);

      expect(separator).not.toBeInTheDocument();
    });
  });

  describe('when a reading time is provided', () => {
    beforeEach(() => {
      setup({ readingTime: MOCK_READING_TIME });
    });

    it('renders the reading time', () => {
      const readingTime = screen.getByText(MOCK_READING_TIME);

      expect(readingTime).toBeVisible();
    });

    it('hides the separator from assistive technology', () => {
      const separator = screen.getByText(SEPARATOR);

      expect(separator).toHaveAttribute('aria-hidden', 'true');
    });
  });
});
