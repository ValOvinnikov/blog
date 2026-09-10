import { renderElement, screen } from '@web/testing/custom-render';

import { PageShell } from './page-shell';

describe(`<${PageShell.name}/>`, () => {
  it('renders Breadcrumbs content outside the main landmark, before it', () => {
    const { container } = renderElement(
      <PageShell>
        <PageShell.Breadcrumbs>
          <div data-testid="crumbs">Crumbs</div>
        </PageShell.Breadcrumbs>
        <PageShell.Content>
          <div data-testid="content">Body</div>
        </PageShell.Content>
      </PageShell>,
    );

    const order = Array.from(
      container.querySelectorAll<HTMLElement>('[data-testid]'),
    ).map((el) => el.getAttribute('data-testid'));

    expect(order).toEqual(['crumbs', 'content']);
    expect(screen.getByTestId('crumbs').closest('main')).toBeNull();
    expect(screen.getByTestId('content').closest('main')).not.toBeNull();
  });

  it('renders Heading before Content, both inside main', () => {
    renderElement(
      <PageShell>
        <PageShell.Heading>
          <h1>Title</h1>
        </PageShell.Heading>
        <PageShell.Content>
          <p>Body</p>
        </PageShell.Content>
      </PageShell>,
    );

    const main = screen.getByRole('main');
    expect(Array.from(main.children).map((el) => el.tagName)).toEqual([
      'H1',
      'P',
    ]);
  });

  it('omits the breadcrumb region when not given', () => {
    renderElement(
      <PageShell>
        <PageShell.Content>
          <p>Body</p>
        </PageShell.Content>
      </PageShell>,
    );

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('omits the heading region when not given', () => {
    renderElement(
      <PageShell>
        <PageShell.Content>
          <p data-testid="content">Body</p>
        </PageShell.Content>
      </PageShell>,
    );

    const main = screen.getByRole('main');
    expect(main.children).toHaveLength(1);
    expect(screen.getByTestId('content').parentElement).toBe(main);
  });

  it('omits the content region when not given', () => {
    renderElement(
      <PageShell>
        <PageShell.Heading>
          <h1>Title</h1>
        </PageShell.Heading>
      </PageShell>,
    );

    const main = screen.getByRole('main');
    expect(main.children).toHaveLength(1);
  });

  it('renders unmatched children after Content, not dropped', () => {
    const { container } = renderElement(
      <PageShell>
        <PageShell.Content>
          <p data-testid="content">Body</p>
        </PageShell.Content>
        <span data-testid="stray">stray content</span>
      </PageShell>,
    );

    const order = Array.from(
      container.querySelectorAll<HTMLElement>('[data-testid]'),
    ).map((el) => el.getAttribute('data-testid'));

    expect(order).toEqual(['content', 'stray']);
  });

  it('renders each region as a direct, unwrapped child of main', () => {
    renderElement(
      <PageShell>
        <PageShell.Heading>
          <div data-testid="heading">Title</div>
        </PageShell.Heading>
        <PageShell.Content>
          <div data-testid="content">Body</div>
        </PageShell.Content>
      </PageShell>,
    );

    const main = screen.getByRole('main');
    expect(screen.getByTestId('heading').parentElement).toBe(main);
    expect(screen.getByTestId('content').parentElement).toBe(main);
  });

  it('renders no heading of its own', () => {
    renderElement(
      <PageShell>
        <PageShell.Content>
          <p>Body, no heading anywhere</p>
        </PageShell.Content>
      </PageShell>,
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('renders a single main landmark', () => {
    renderElement(<PageShell />);
    expect(screen.getByRole('main')).toBeVisible();
  });

  it('forwards data-testid to the main element', () => {
    renderElement(<PageShell dataTestId="page-shell" />);
    expect(screen.getByTestId('page-shell')).toBeVisible();
  });
});
