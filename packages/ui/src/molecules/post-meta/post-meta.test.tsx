import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';

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

describe(`<${PostMeta.name}/>`, () => {
  it('renders author name and avatar image', () => {
    render(
      <PostMeta
        author={author}
        publishedAt={publishedAt}
        formattedDate={formattedDate}
      />,
    );
    expect(screen.getByText(author.name)).toBeVisible();
    expect(screen.getByRole('img', { name: author.name })).toBeVisible();
  });

  it('renders a time element with the correct dateTime attribute and label', () => {
    render(
      <PostMeta
        author={author}
        publishedAt={publishedAt}
        formattedDate={formattedDate}
      />,
    );
    const timeEl = screen.getByText(formattedDate);
    expect(timeEl).toBeVisible();
    expect(timeEl.tagName).toBe('TIME');
    expect(timeEl).toHaveAttribute('dateTime', publishedAt);
  });

  it('renders reading time when provided', () => {
    render(
      <PostMeta
        author={author}
        publishedAt={publishedAt}
        formattedDate={formattedDate}
        readingTimeMinutes={readingTimeMinutes}
      />,
    );
    expect(screen.getByText(`${readingTimeMinutes} min read`)).toBeVisible();
  });

  it('omits reading time segment when not provided', () => {
    render(
      <PostMeta
        author={author}
        publishedAt={publishedAt}
        formattedDate={formattedDate}
      />,
    );
    expect(screen.queryByText(/min read/)).not.toBeInTheDocument();
  });

  it('falls back to initials when imageUrl is not provided', () => {
    render(
      <PostMeta
        author={{ name: author.name }}
        publishedAt={publishedAt}
        formattedDate={formattedDate}
      />,
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getAllByText(author.name).length).toBeGreaterThan(0);
  });

  it('forwards dataTestId to root element', () => {
    render(
      <PostMeta
        author={author}
        publishedAt={publishedAt}
        formattedDate={formattedDate}
        dataTestId="post-meta"
      />,
    );
    expect(screen.getByTestId('post-meta')).toBeVisible();
  });

  it('omits the share trigger when share is not provided', () => {
    render(
      <PostMeta
        author={author}
        publishedAt={publishedAt}
        formattedDate={formattedDate}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /share/i }),
    ).not.toBeInTheDocument();
  });

  it('renders the share slot when share is provided', () => {
    render(
      <PostMeta
        author={author}
        publishedAt={publishedAt}
        formattedDate={formattedDate}
        share={<button>share</button>}
      />,
    );
    expect(screen.getByRole('button', { name: 'share' })).toBeVisible();
  });
});
