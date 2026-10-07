import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { CardMeta } from './card-meta';

faker.seed(123);

const dateValue = faker.date.past().toISOString();
const dateLabel = faker.date.past().toLocaleDateString('en-GB', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
const readingTime = `${faker.number.int({ min: 3, max: 15 })} min`;

const setup = customRender(CardMeta, {
  dateValue,
  dateLabel,
});

describe(`<${CardMeta.name}/>`, () => {
  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders time element with correct dateTime attribute', () => {
      const timeEl = screen.getByRole('time');
      expect(timeEl).toBeVisible();
      expect(timeEl).toHaveAttribute('dateTime', dateValue);
      expect(timeEl).toHaveTextContent(dateLabel);
    });

    it('omits readingTime segment and its separator when not provided — only the decorative chevron is aria-hidden', () => {
      expect(screen.getByTestId('card-meta-chevron')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
      expect(screen.queryByText('·')).not.toBeInTheDocument();
    });

    it('renders a decorative chevron before the date', () => {
      expect(screen.getByTestId('card-meta-chevron')).toBeVisible();
    });
  });

  describe('when readingTime is provided', () => {
    beforeEach(() => {
      setup({ readingTime });
    });

    it('renders readingTime text when provided', () => {
      expect(screen.getByText(readingTime)).toBeVisible();
    });

    it('renders the chevron and separator as aria-hidden when readingTime is provided', () => {
      expect(screen.getByTestId('card-meta-chevron')).toHaveAttribute(
        'aria-hidden',
        'true',
      );
      expect(screen.getByText('·')).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('forwards dataTestId to root element', () => {
    setup({ dataTestId: 'card-meta' });
    expect(screen.getByTestId('card-meta')).toBeVisible();
  });
});
