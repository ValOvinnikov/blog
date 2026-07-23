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
const category = faker.lorem.word();

const setup = customRender(CardMeta, {
  dateValue,
  dateLabel,
  category,
});

describe(`<${CardMeta.name}/>`, () => {
  it('renders time element with correct dateTime attribute', () => {
    setup();
    const timeEl = screen.getByRole('time');
    expect(timeEl).toBeVisible();
    expect(timeEl).toHaveAttribute('dateTime', dateValue);
    expect(timeEl).toHaveTextContent(dateLabel);
  });

  it('renders readingTime text when provided', () => {
    setup({ readingTime });
    expect(screen.getByText(readingTime)).toBeVisible();
  });

  it('omits readingTime segment and its separator when not provided — only one aria-hidden separator', () => {
    const { container } = setup();
    const separators = container.querySelectorAll('[aria-hidden="true"]');
    expect(separators).toHaveLength(1);
  });

  it('renders two separators when readingTime is provided', () => {
    const { container } = setup({ readingTime });
    const separators = container.querySelectorAll('[aria-hidden="true"]');
    expect(separators).toHaveLength(2);
  });

  it('renders category in uppercase', () => {
    setup();
    expect(screen.getByText(category.toUpperCase())).toBeVisible();
  });

  it('category element has text-accent class', () => {
    setup();
    const categoryEl = screen.getByText(category.toUpperCase());
    expect(categoryEl).toHaveClass('text-accent');
  });

  it('forwards dataTestId to root element', () => {
    setup({ dataTestId: 'card-meta' });
    expect(screen.getByTestId('card-meta')).toBeVisible();
  });
});
