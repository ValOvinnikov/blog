import { customRender, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';
import type { ReactNode } from 'react';

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

  it('omits category links when categories is not provided', () => {
    setup();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('omits category links when categories is an empty array', () => {
    setup({ categories: [] });
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders each category as a link to its href when provided', () => {
    const categories = [
      {
        label: faker.commerce.department(),
        href: `/categories/${faker.lorem.slug()}`,
      },
      {
        label: faker.commerce.department(),
        href: `/categories/${faker.lorem.slug()}`,
      },
    ];
    setup({ categories });
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(categories.length);
    categories.forEach((category) => {
      expect(
        screen.getByRole('link', { name: category.label }),
      ).toHaveAttribute('href', category.href);
    });
  });

  it('renders each category as the linkAs component when provided', () => {
    const categories = [
      {
        label: faker.commerce.department(),
        href: `/categories/${faker.lorem.slug()}`,
      },
      {
        label: faker.commerce.department(),
        href: `/categories/${faker.lorem.slug()}`,
      },
    ];
    const CustomLink = ({
      href,
      children,
    }: {
      href: string;
      children?: ReactNode;
    }) => (
      <a href={href} data-custom-link="true">
        {children}
      </a>
    );
    setup({ categories, linkAs: CustomLink });
    categories.forEach((category) => {
      const link = screen.getByRole('link', { name: category.label });
      expect(link).toHaveAttribute('data-custom-link', 'true');
    });
  });

  it('renders the author name as plain text when href is not provided', () => {
    setup();
    expect(
      screen.queryByRole('link', { name: author.name }),
    ).not.toBeInTheDocument();
  });

  it('renders the author name as a link to its href when provided', () => {
    const authorHref = `/authors/${faker.lorem.slug()}`;
    setup({ author: { ...author, href: authorHref } });
    expect(screen.getByRole('link', { name: author.name })).toHaveAttribute(
      'href',
      authorHref,
    );
  });

  it('renders the author link as the linkAs component when provided', () => {
    const authorHref = `/authors/${faker.lorem.slug()}`;
    const CustomLink = ({
      href,
      children,
    }: {
      href: string;
      children?: ReactNode;
    }) => (
      <a href={href} data-custom-link="true">
        {children}
      </a>
    );
    setup({
      author: { ...author, href: authorHref },
      linkAs: CustomLink,
    });
    const link = screen.getByRole('link', { name: author.name });
    expect(link).toHaveAttribute('data-custom-link', 'true');
  });
});
