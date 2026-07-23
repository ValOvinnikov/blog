import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

import { PostMeta } from './post-meta';

faker.seed(123);

const author = {
  name: faker.person.fullName(),
  imageUrl: faker.image.avatarGitHub(),
};
const publishedAt = faker.date.past().toISOString();
const formattedDate = faker.date.past().toLocaleDateString('en-GB', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});
const readingTimeMinutes = faker.number.int({ min: 3, max: 15 });

const setup = customRender(PostMeta, {
  author,
  publishedAt,
  formattedDate,
});

describe(`<${PostMeta.name}/>`, () => {
  it('renders author name and avatar image', () => {
    setup();
    expect(screen.getByText(author.name)).toBeVisible();
    expect(screen.getByRole('img', { name: author.name })).toBeVisible();
  });

  it('renders a time element with the correct dateTime attribute and label', () => {
    setup();
    const timeEl = screen.getByText(formattedDate);
    expect(timeEl).toBeVisible();
    expect(timeEl.tagName).toBe('TIME');
    expect(timeEl).toHaveAttribute('dateTime', publishedAt);
  });

  it('renders reading time when provided', () => {
    setup({ readingTimeMinutes });
    expect(screen.getByText(`${readingTimeMinutes} min read`)).toBeVisible();
  });

  it('omits reading time segment when not provided', () => {
    setup();
    expect(screen.queryByText(/min read/)).not.toBeInTheDocument();
  });

  it('falls back to initials when imageUrl is not provided', () => {
    setup({ author: { name: author.name } });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getAllByText(author.name).length).toBeGreaterThan(0);
  });

  it('forwards dataTestId to root element', () => {
    setup({ dataTestId: 'post-meta' });
    expect(screen.getByTestId('post-meta')).toBeVisible();
  });

  it('renders the top/bottom rule on the root element', () => {
    setup({ dataTestId: 'post-meta' });
    expect(screen.getByTestId('post-meta')).toHaveClass(
      'border-y',
      'border-border',
    );
  });

  it('omits the share trigger when share is not provided', () => {
    setup();
    expect(
      screen.queryByRole('button', { name: /share/i }),
    ).not.toBeInTheDocument();
  });

  it('renders the share slot when share is provided', () => {
    setup({ share: <button>share</button> });
    expect(screen.getByRole('button', { name: 'share' })).toBeVisible();
  });
});
