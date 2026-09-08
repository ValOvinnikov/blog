import { renderElement, screen } from '@web/testing/custom-render';

import { PostCardItem, type IPostCardData } from './post-card-item';

vi.mock('@web/components/shared/smart-link', () => ({
  SmartLink: ({
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

const item: IPostCardData = {
  id: 'post-1',
  href: '/blog/hello-world',
  title: 'Hello World',
  excerpt: 'An excerpt.',
  publishedAt: '2026-01-15T00:00:00.000Z',
  formattedDate: 'January 15, 2026',
  readingTime: '4 min',
  topic: { title: 'Engineering' },
};

describe(PostCardItem, () => {
  it('renders the title linked via SmartLink to item.href', () => {
    renderElement(<PostCardItem item={item} />);

    const link = screen.getByRole('link', { name: 'Hello World' });
    expect(link).toHaveAttribute('href', '/blog/hello-world');
  });

  it('defaults to heading level 3', () => {
    renderElement(<PostCardItem item={item} />);

    expect(
      screen.getByRole('heading', { level: 3, name: 'Hello World' }),
    ).toBeVisible();
  });

  it('renders the title at the given headingLevel', () => {
    renderElement(<PostCardItem item={item} headingLevel={2} />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Hello World' }),
    ).toBeVisible();
  });

  it('renders no media region when hasImage is omitted', () => {
    renderElement(<PostCardItem item={item} />);

    expect(screen.queryByTestId('post-card-media')).not.toBeInTheDocument();
  });

  it('renders the pre-rendered image node inside PostCard.Media when hasImage is true', () => {
    renderElement(
      <PostCardItem
        item={{ ...item, image: <div data-testid="post-image" /> }}
        hasImage={true}
      />,
    );

    expect(screen.getByTestId('post-card-media')).toBeInTheDocument();
    expect(screen.getByTestId('post-image')).toBeInTheDocument();
  });

  it('renders the formatted date and reading time', () => {
    renderElement(<PostCardItem item={item} />);

    expect(screen.getByText('January 15, 2026')).toBeVisible();
    expect(screen.getByText(/4 min/)).toBeVisible();
  });

  it('renders the topic in the footer', () => {
    renderElement(<PostCardItem item={item} />);

    expect(screen.getByText(/engineering/)).toBeVisible();
  });
});
