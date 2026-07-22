import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';

import { ArticleHeader } from './article-header';

faker.seed(123);

const meta = {
  author: { name: faker.person.fullName() },
  publishedAt: faker.date.past().toISOString(),
  formattedDate: faker.date.past().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }),
};

describe(`<${ArticleHeader.name}/>`, () => {
  it('renders the title as an <h1>', () => {
    render(<ArticleHeader title="Building a Design System" meta={meta} />);
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Building a Design System',
      }),
    ).toBeVisible();
  });

  it('renders a single category as a link to its route', () => {
    render(
      <ArticleHeader
        title="Building a Design System"
        meta={meta}
        categories={[{ label: 'Engineering', href: '/category/engineering' }]}
      />,
    );
    expect(screen.getByRole('link', { name: 'Engineering' })).toHaveAttribute(
      'href',
      '/category/engineering',
    );
  });

  it('renders multiple categories as separate links', () => {
    render(
      <ArticleHeader
        title="Building a Design System"
        meta={meta}
        categories={[
          { label: 'Engineering', href: '/category/engineering' },
          { label: 'Design Systems', href: '/category/design-systems' },
        ]}
      />,
    );
    expect(screen.getByRole('link', { name: 'Engineering' })).toHaveAttribute(
      'href',
      '/category/engineering',
    );
    expect(
      screen.getByRole('link', { name: 'Design Systems' }),
    ).toHaveAttribute('href', '/category/design-systems');
  });

  it('does not render any category links when categories is omitted', () => {
    render(<ArticleHeader title="Building a Design System" meta={meta} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('does not render any category links when categories is an empty array', () => {
    render(
      <ArticleHeader
        title="Building a Design System"
        meta={meta}
        categories={[]}
      />,
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders the lead paragraph when provided', () => {
    render(
      <ArticleHeader
        title="Building a Design System"
        meta={meta}
        lead="A walkthrough of Atomic Design with Tailwind."
      />,
    );
    expect(
      screen.getByText('A walkthrough of Atomic Design with Tailwind.'),
    ).toBeVisible();
  });

  it('does not render a lead paragraph when omitted', () => {
    render(<ArticleHeader title="Building a Design System" meta={meta} />);
    expect(
      screen.queryByText('A walkthrough of Atomic Design with Tailwind.'),
    ).not.toBeInTheDocument();
  });

  it('renders the PostMeta author name', () => {
    render(<ArticleHeader title="Building a Design System" meta={meta} />);
    expect(screen.getAllByText(meta.author.name).length).toBeGreaterThan(0);
  });

  it('does not render a PostMeta strip when meta is omitted', () => {
    render(<ArticleHeader title="Building a Design System" />);
    expect(screen.queryByText(meta.author.name)).not.toBeInTheDocument();
    expect(screen.queryByText(meta.formattedDate)).not.toBeInTheDocument();
  });

  it('still renders title, lead, and coverMedia when meta is omitted', () => {
    render(
      <ArticleHeader
        title="Building a Design System"
        lead="A walkthrough of Atomic Design with Tailwind."
        coverMedia={<img src="/cover.jpg" alt="Post cover" />}
      />,
    );
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Building a Design System',
      }),
    ).toBeVisible();
    expect(
      screen.getByText('A walkthrough of Atomic Design with Tailwind.'),
    ).toBeVisible();
    expect(screen.getByAltText('Post cover')).toBeVisible();
  });

  it('renders coverMedia content when provided', () => {
    render(
      <ArticleHeader
        title="Building a Design System"
        meta={meta}
        coverMedia={<img src="/cover.jpg" alt="Post cover" />}
      />,
    );
    expect(screen.getByAltText('Post cover')).toBeVisible();
  });

  it('does not render a coverMedia wrapper when omitted', () => {
    render(<ArticleHeader title="Building a Design System" meta={meta} />);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('forwards dataTestId to the root element', () => {
    render(
      <ArticleHeader
        title="Building a Design System"
        meta={meta}
        dataTestId="article-header"
      />,
    );
    expect(screen.getByTestId('article-header')).toBeVisible();
  });
});
