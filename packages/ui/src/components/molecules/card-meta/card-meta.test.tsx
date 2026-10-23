import { customRender, screen } from '@blog/ui/testing/custom-render';
import {
  MOCK_FORMATTED_DATE,
  MOCK_PUBLISHED_AT,
} from '@blog/ui/testing/fixtures';
import { faker } from '@faker-js/faker';

import { CardMeta } from './card-meta';

faker.seed(123);

const readingTime = `${faker.number.int({ min: 3, max: 15 })} min`;

const setup = customRender(CardMeta, {
  dateValue: MOCK_PUBLISHED_AT,
  dateLabel: MOCK_FORMATTED_DATE,
});

describe(`<${CardMeta.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders time element with correct dateTime attribute', () => {
      const timeEl = screen.getByRole('time');
      expect(timeEl).toBeVisible();
      expect(timeEl).toHaveAttribute('dateTime', MOCK_PUBLISHED_AT);
      expect(timeEl).toHaveTextContent(MOCK_FORMATTED_DATE);
    });

    it('omits readingTime segment and its separator when not provided', () => {
      expect(screen.queryByText('·')).not.toBeInTheDocument();
    });
  });

  describe('when readingTime is provided', () => {
    beforeEach(() => {
      setup({ readingTime });
    });

    it('renders readingTime text when provided', () => {
      expect(screen.getByText(readingTime)).toBeVisible();
    });

    it('renders the separator as aria-hidden when readingTime is provided', () => {
      expect(screen.getByText('·')).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('forwards dataTestId to root element', () => {
    setup({ dataTestId: 'card-meta' });
    expect(screen.getByTestId('card-meta')).toBeVisible();
  });
});
