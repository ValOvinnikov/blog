import { renderElement, screen } from '@web/testing/custom-render';

import { MediaCardItem, type IMediaCardData } from './media-card-item';

vi.mock('@web/i18n/navigation');

const item: IMediaCardData = {
  id: 'post-1',
  href: '/blog/hello-world',
  title: 'Hello World',
  excerpt: 'An excerpt.',
  publishedAt: '2026-01-15T00:00:00.000Z',
  formattedDate: 'January 15, 2026',
  readingTime: '4 min',
  topic: { title: 'Engineering' },
};

describe(`<${MediaCardItem.name}/>`, () => {
  describe('with the base item', () => {
    beforeEach(() => {
      renderElement(<MediaCardItem item={item} />);
    });

    it('renders the title linked via SmartLink to item.href', () => {
      const link = screen.getByRole('link', { name: 'Hello World' });
      expect(link).toHaveAttribute('href', '/blog/hello-world');
    });

    it('defaults to heading level 3', () => {
      expect(
        screen.getByRole('heading', { level: 3, name: 'Hello World' }),
      ).toBeVisible();
    });

    it('renders no media region when hasImage is omitted', () => {
      expect(screen.queryByTestId('media-card-media')).not.toBeInTheDocument();
    });

    it('renders the formatted date and reading time', () => {
      expect(screen.getByText('January 15, 2026')).toBeVisible();
      expect(screen.getByText(/4 min/)).toBeVisible();
    });

    it('renders the topic in the footer', () => {
      expect(screen.getByText(/engineering/)).toBeVisible();
    });

    it('renders no dataTestId on the underlying MediaCard when omitted', () => {
      expect(screen.getByRole('article')).not.toHaveAttribute('data-testid');
    });
  });

  it('renders the title at the given headingLevel', () => {
    renderElement(<MediaCardItem item={item} headingLevel={2} />);

    expect(
      screen.getByRole('heading', { level: 2, name: 'Hello World' }),
    ).toBeVisible();
  });

  it('renders the pre-rendered image node inside MediaCard.Media when hasImage is true', () => {
    renderElement(
      <MediaCardItem
        item={{ ...item, image: <div data-testid="post-image" /> }}
        hasImage={true}
      />,
    );

    expect(screen.getByTestId('media-card-media')).toBeVisible();
    expect(screen.getByTestId('post-image')).toBeVisible();
  });

  it('forwards dataTestId to the underlying MediaCard', () => {
    renderElement(<MediaCardItem item={item} dataTestId="lead-card" />);

    expect(screen.getByTestId('lead-card')).toBeVisible();
  });
});
