import { renderElement, screen, within } from '@web/testing/custom-render';

import { PageShell } from './page-shell';

const renderedTestIdOrder = () =>
  screen.getAllByTestId(/.+/).map((el) => el.getAttribute('data-testid'));

describe(`<${PageShell.name}/>`, () => {
  it('renders Breadcrumbs content outside the main landmark, before it', () => {
    renderElement(
      <PageShell>
        <PageShell.Breadcrumbs>
          <div data-testid="crumbs">Crumbs</div>
        </PageShell.Breadcrumbs>
        <PageShell.Content>
          <div data-testid="content">Body</div>
        </PageShell.Content>
      </PageShell>,
    );

    const main = screen.getByRole('main');
    const crumbsInMain = within(main).queryByTestId('crumbs');
    const contentInMain = within(main).getByTestId('content');

    expect(renderedTestIdOrder()).toEqual(['crumbs', 'content']);
    expect(crumbsInMain).not.toBeInTheDocument();
    expect(contentInMain).toBeVisible();
  });

  it('renders Heading before Content, both inside main', () => {
    renderElement(
      <PageShell>
        <PageShell.Content>
          <p data-testid="content">Body</p>
        </PageShell.Content>
        <PageShell.Heading>
          <h1 data-testid="heading">Title</h1>
        </PageShell.Heading>
      </PageShell>,
    );

    const main = screen.getByRole('main');
    const headingInMain = within(main).getByRole('heading', {
      level: 1,
      name: 'Title',
    });
    const contentInMain = within(main).getByTestId('content');

    expect(renderedTestIdOrder()).toEqual(['heading', 'content']);
    expect(headingInMain).toBeVisible();
    expect(contentInMain).toBeVisible();
  });

  it('omits the breadcrumb region when not given', () => {
    renderElement(
      <PageShell>
        <PageShell.Content>
          <p>Body</p>
        </PageShell.Content>
      </PageShell>,
    );

    const navigation = screen.queryByRole('navigation');

    expect(navigation).not.toBeInTheDocument();
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
    const heading = screen.queryByRole('heading');
    const contentInMain = within(main).getByTestId('content');

    expect(heading).not.toBeInTheDocument();
    expect(contentInMain).toBeVisible();
    expect(renderedTestIdOrder()).toEqual(['content']);
  });

  it('omits the content region when not given', () => {
    renderElement(
      <PageShell>
        <PageShell.Heading>
          <h1 data-testid="heading">Title</h1>
        </PageShell.Heading>
      </PageShell>,
    );

    const main = screen.getByRole('main');
    const headingInMain = within(main).getByTestId('heading');

    expect(headingInMain).toBeVisible();
    expect(renderedTestIdOrder()).toEqual(['heading']);
  });

  it('renders unmatched children after Content, not dropped', () => {
    renderElement(
      <PageShell>
        <PageShell.Content>
          <p data-testid="content">Body</p>
        </PageShell.Content>
        <span data-testid="stray">stray content</span>
      </PageShell>,
    );

    expect(renderedTestIdOrder()).toEqual(['content', 'stray']);
  });

  it('renders no heading of its own', () => {
    renderElement(
      <PageShell>
        <PageShell.Content>
          <p>Body, no heading anywhere</p>
        </PageShell.Content>
      </PageShell>,
    );

    const heading = screen.queryByRole('heading');

    expect(heading).not.toBeInTheDocument();
  });

  it('forwards data-testid to the main landmark', () => {
    renderElement(<PageShell dataTestId="page-shell" />);

    const main = screen.getByRole('main');
    const shell = screen.getByTestId('page-shell');

    expect(main).toBe(shell);
  });
});
