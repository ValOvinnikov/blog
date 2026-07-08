import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';

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

describe(`<${CardMeta.name}/>`, () => {
  it('renders time element with correct dateTime attribute', () => {
    render(
      <CardMeta
        dateValue={dateValue}
        dateLabel={dateLabel}
        category={category}
      />,
    );
    const timeEl = screen.getByRole('time');
    expect(timeEl).toBeVisible();
    expect(timeEl).toHaveAttribute('dateTime', dateValue);
    expect(timeEl).toHaveTextContent(dateLabel);
  });

  it('renders readingTime text when provided', () => {
    render(
      <CardMeta
        dateValue={dateValue}
        dateLabel={dateLabel}
        readingTime={readingTime}
        category={category}
      />,
    );
    expect(screen.getByText(readingTime)).toBeVisible();
  });

  it('omits readingTime segment and its separator when not provided — only one aria-hidden separator', () => {
    const { container } = render(
      <CardMeta
        dateValue={dateValue}
        dateLabel={dateLabel}
        category={category}
      />,
    );
    const separators = container.querySelectorAll('[aria-hidden="true"]');
    expect(separators).toHaveLength(1);
  });

  it('renders two separators when readingTime is provided', () => {
    const { container } = render(
      <CardMeta
        dateValue={dateValue}
        dateLabel={dateLabel}
        readingTime={readingTime}
        category={category}
      />,
    );
    const separators = container.querySelectorAll('[aria-hidden="true"]');
    expect(separators).toHaveLength(2);
  });

  it('renders category in uppercase', () => {
    render(
      <CardMeta
        dateValue={dateValue}
        dateLabel={dateLabel}
        category={category}
      />,
    );
    expect(screen.getByText(category.toUpperCase())).toBeVisible();
  });

  it('category element has text-accent class', () => {
    render(
      <CardMeta
        dateValue={dateValue}
        dateLabel={dateLabel}
        category={category}
      />,
    );
    const categoryEl = screen.getByText(category.toUpperCase());
    expect(categoryEl).toHaveClass('text-accent');
  });

  it('forwards dataTestId to root element', () => {
    render(
      <CardMeta
        dateValue={dateValue}
        dateLabel={dateLabel}
        category={category}
        dataTestId="card-meta"
      />,
    );
    expect(screen.getByTestId('card-meta')).toBeVisible();
  });
});
