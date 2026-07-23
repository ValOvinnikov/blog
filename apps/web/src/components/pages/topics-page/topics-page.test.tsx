import { customRenderAsync, screen } from '@web/testing/custom-render';

import { TopicsPage } from './topics-page';

const { getCategoriesMock } = vi.hoisted(() => ({
  getCategoriesMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    entities: {
      categories: { v1: { getCategories: getCategoriesMock } },
    },
  },
}));

vi.mock('@web/i18n/navigation', () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

const setup = customRenderAsync(TopicsPage, {});

describe(`<${TopicsPage.name}/>`, () => {
  beforeEach(() => {
    getCategoriesMock.mockReset();
  });

  it('renders the page heading', async () => {
    getCategoriesMock.mockResolvedValue([]);

    await setup();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Topics' }),
    ).toBeVisible();
  });

  it('renders a card per category, linking to its category archive', async () => {
    getCategoriesMock.mockResolvedValue([
      {
        id: 'cat-1',
        title: 'Engineering',
        slug: 'engineering',
        description: 'Posts about building things.',
        postCount: 5,
      },
    ]);

    await setup();

    const link = screen.getByRole('link', { name: 'Engineering' });
    expect(link).toHaveAttribute('href', '/category/engineering');
    expect(screen.getByText('Posts about building things.')).toBeVisible();
    expect(screen.getByText('5 posts')).toBeVisible();
  });

  it('omits the description when the category has none', async () => {
    getCategoriesMock.mockResolvedValue([
      {
        id: 'cat-1',
        title: 'Engineering',
        slug: 'engineering',
        description: undefined,
        postCount: 5,
      },
    ]);

    await setup();

    expect(
      screen.queryByText('Posts about building things.'),
    ).not.toBeInTheDocument();
  });

  it('renders singular "1 post" for a category with exactly one post', async () => {
    getCategoriesMock.mockResolvedValue([
      {
        id: 'cat-1',
        title: 'Engineering',
        slug: 'engineering',
        description: undefined,
        postCount: 1,
      },
    ]);

    await setup();

    expect(screen.getByText('1 post')).toBeVisible();
  });

  it('renders an empty-state message when there are no categories', async () => {
    getCategoriesMock.mockResolvedValue([]);

    await setup();

    expect(screen.getByText('No topics yet.')).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('renders the empty state instead of crashing when the fetch throws', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    getCategoriesMock.mockRejectedValue(
      new Error('Configuration must contain `projectId`'),
    );

    await setup();

    expect(screen.getByText('No topics yet.')).toBeVisible();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();

    errorSpy.mockRestore();
  });
});
