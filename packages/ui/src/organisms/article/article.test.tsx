import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';

import { Article } from './article';

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

describe(`<${Article.name}/>`, () => {
  it('renders as an <article> landmark wrapping Header and Body', () => {
    render(
      <Article>
        <Article.Header title="Building a Design System" meta={meta} />
        <Article.Body>
          <p>Post body content.</p>
        </Article.Body>
      </Article>,
    );
    expect(screen.getByRole('article')).toBeVisible();
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Building a Design System',
      }),
    ).toBeVisible();
    expect(screen.getByText('Post body content.')).toBeVisible();
  });

  it('renders a single category as a link to its route', () => {
    render(
      <Article>
        <Article.Header
          title="Building a Design System"
          meta={meta}
          categories={[{ label: 'Engineering', href: '/category/engineering' }]}
        />
        <Article.Body>
          <p>Post body content.</p>
        </Article.Body>
      </Article>,
    );
    expect(screen.getByRole('link', { name: 'Engineering' })).toHaveAttribute(
      'href',
      '/category/engineering',
    );
  });

  it('renders multiple categories as separate links', () => {
    render(
      <Article>
        <Article.Header
          title="Building a Design System"
          meta={meta}
          categories={[
            { label: 'Engineering', href: '/category/engineering' },
            { label: 'Design Systems', href: '/category/design-systems' },
          ]}
        />
        <Article.Body>
          <p>Post body content.</p>
        </Article.Body>
      </Article>,
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
    render(
      <Article>
        <Article.Header title="Building a Design System" meta={meta} />
        <Article.Body>
          <p>Post body content.</p>
        </Article.Body>
      </Article>,
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('does not render any category links when categories is an empty array', () => {
    render(
      <Article>
        <Article.Header
          title="Building a Design System"
          meta={meta}
          categories={[]}
        />
        <Article.Body>
          <p>Post body content.</p>
        </Article.Body>
      </Article>,
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders the lead paragraph when provided', () => {
    render(
      <Article>
        <Article.Header
          title="Building a Design System"
          meta={meta}
          lead="A walkthrough of Atomic Design with Tailwind."
        />
        <Article.Body>
          <p>Post body content.</p>
        </Article.Body>
      </Article>,
    );
    expect(
      screen.getByText('A walkthrough of Atomic Design with Tailwind.'),
    ).toBeVisible();
  });

  it('does not render a lead paragraph when omitted', () => {
    render(
      <Article>
        <Article.Header title="Building a Design System" meta={meta} />
        <Article.Body>
          <p>Post body content.</p>
        </Article.Body>
      </Article>,
    );
    expect(
      screen.queryByText('A walkthrough of Atomic Design with Tailwind.'),
    ).not.toBeInTheDocument();
  });

  it('does not render a PostMeta strip when meta is omitted', () => {
    render(
      <Article>
        <Article.Header title="Building a Design System" />
        <Article.Body>
          <p>Post body content.</p>
        </Article.Body>
      </Article>,
    );
    expect(screen.queryByText(meta.author.name)).not.toBeInTheDocument();
    expect(screen.queryByText(meta.formattedDate)).not.toBeInTheDocument();
  });

  it('renders coverMedia content when provided', () => {
    render(
      <Article>
        <Article.Header
          title="Building a Design System"
          meta={meta}
          coverMedia={<img src="/cover.jpg" alt="Post cover" />}
        />
        <Article.Body>
          <p>Post body content.</p>
        </Article.Body>
      </Article>,
    );
    expect(screen.getByAltText('Post cover')).toBeVisible();
  });

  it('does not render a coverMedia wrapper when omitted', () => {
    render(
      <Article>
        <Article.Header title="Building a Design System" meta={meta} />
        <Article.Body>
          <p>Post body content.</p>
        </Article.Body>
      </Article>,
    );
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('renders Article.Body children', () => {
    render(
      <Article>
        <Article.Header title="Building a Design System" meta={meta} />
        <Article.Body>
          <p>{faker.lorem.paragraph()}</p>
        </Article.Body>
      </Article>,
    );
    expect(screen.getByRole('article')).toBeVisible();
  });

  it('forwards dataTestId to the root element', () => {
    render(
      <Article dataTestId="article">
        <Article.Header title="Building a Design System" meta={meta} />
        <Article.Body>
          <p>Post body content.</p>
        </Article.Body>
      </Article>,
    );
    expect(screen.getByTestId('article')).toBeVisible();
  });
});
