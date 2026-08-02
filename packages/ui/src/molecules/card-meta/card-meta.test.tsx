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

  it('omits readingTime segment and its separator when not provided — only the decorative chevron is aria-hidden', () => {
    const { container } = setup();
    const hidden = container.querySelectorAll('[aria-hidden="true"]');
    expect(hidden).toHaveLength(1);
  });

  it('renders the chevron and separator as aria-hidden when readingTime is provided', () => {
    const { container } = setup({ readingTime });
    const hidden = container.querySelectorAll('[aria-hidden="true"]');
    expect(hidden).toHaveLength(2);
  });

  it('renders a decorative chevron before the date', () => {
    setup();
    expect(screen.getByText('❯')).toBeVisible();
  });

  it('forwards dataTestId to root element', () => {
    setup({ dataTestId: 'card-meta' });
    expect(screen.getByTestId('card-meta')).toBeVisible();
  });
});
