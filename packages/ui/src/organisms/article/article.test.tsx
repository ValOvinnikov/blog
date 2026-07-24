import { renderElement, screen } from '@blog/ui/testing/custom-render';
import { faker } from '@faker-js/faker';

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
    renderElement(
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

  it('renders the category as an eyebrow link to its route', () => {
    renderElement(
      <Article>
        <Article.Header
          title="Building a Design System"
          meta={meta}
          category={{ label: 'Engineering', href: '/category/engineering' }}
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

  it('does not render a category link when category is omitted', () => {
    renderElement(
      <Article>
        <Article.Header title="Building a Design System" meta={meta} />
        <Article.Body>
          <p>Post body content.</p>
        </Article.Body>
      </Article>,
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders the lead paragraph when provided', () => {
    renderElement(
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
    renderElement(
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
    renderElement(
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
    renderElement(
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
    renderElement(
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
    renderElement(
      <Article>
        <Article.Header title="Building a Design System" meta={meta} />
        <Article.Body>
          <p>{faker.lorem.paragraph()}</p>
        </Article.Body>
      </Article>,
    );
    expect(screen.getByRole('article')).toBeVisible();
  });

  it('renders Article.Footer tags as links to their routes', () => {
    renderElement(
      <Article>
        <Article.Header title="Building a Design System" meta={meta} />
        <Article.Body>
          <p>Post body content.</p>
        </Article.Body>
        <Article.Footer
          tags={[
            { label: 'TypeScript', href: '/tag/typescript' },
            { label: 'Testing', href: '/tag/testing' },
          ]}
        />
      </Article>,
    );
    expect(screen.getByRole('link', { name: 'TypeScript' })).toHaveAttribute(
      'href',
      '/tag/typescript',
    );
    expect(screen.getByRole('link', { name: 'Testing' })).toHaveAttribute(
      'href',
      '/tag/testing',
    );
  });

  it('does not render an Article.Footer when tags is empty', () => {
    renderElement(
      <Article>
        <Article.Header title="Building a Design System" meta={meta} />
        <Article.Body>
          <p>Post body content.</p>
        </Article.Body>
        <Article.Footer tags={[]} />
      </Article>,
    );
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('forwards dataTestId to the root element', () => {
    renderElement(
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
