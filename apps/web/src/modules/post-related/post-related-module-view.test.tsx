import { BRAND_VARIANT } from '@blog/config';
import { customRender, screen } from '@web/testing/custom-render';
import { makePostListItem } from '@web/testing/modules/post-list/fixtures';

import { PostRelatedModuleView } from './post-related-module-view';

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

const post = makePostListItem();

const setup = customRender(PostRelatedModuleView, {
  brandVariant: BRAND_VARIANT.PRIMARY,
  sectionHeader: {
    heading: 'Related reading',
    supportingText: undefined,
  },
  items: [post],
  layout: undefined,
  contentAlignment: undefined,
  titleId: 'related-posts-title',
  dataTestId: 'post-related-module-post-related-1',
  accessibleTitle: 'Related reading',
});

describe(PostRelatedModuleView, () => {
  it('labels the section with the given titleId', () => {
    setup();

    const label = screen.getByText('Related reading');
    expect(label).toHaveAttribute('id', 'related-posts-title');
    expect(label.tagName).toBe('H2');

    const section = label.closest('section');
    expect(section).toHaveAttribute('aria-labelledby', 'related-posts-title');
    expect(section).toHaveAttribute(
      'data-testid',
      'post-related-module-post-related-1',
    );
    expect(
      screen.getByRole('region', { name: 'Related reading' }),
    ).toBeInTheDocument();
  });

  it('renders a visually hidden heading from accessibleTitle when sectionHeader.heading is undefined', () => {
    setup({
      sectionHeader: {
        heading: undefined,
        supportingText: undefined,
      },
    });

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Related reading',
    });
    expect(heading).toHaveClass('sr-only');
    expect(
      screen.getByRole('region', { name: 'Related reading' }),
    ).toBeInTheDocument();
  });

  it('renders a card per item, linked to its href', () => {
    setup();

    const link = screen.getByRole('link', { name: post.title });
    expect(link).toHaveAttribute('href', post.href);
    expect(
      screen.getByRole('heading', { level: 3, name: post.title }),
    ).toBeInTheDocument();
  });

  it('never renders a pagination nav', () => {
    setup();

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('renders no media region when hasImages is not given', () => {
    setup();

    expect(screen.queryByTestId('post-card-media')).not.toBeInTheDocument();
  });

  it('renders a media region for each item when hasImages is true', () => {
    setup({
      hasImages: true,
      items: [{ ...post, image: <div data-testid="post-image" /> }],
    });

    expect(screen.getByTestId('post-card-media')).toBeInTheDocument();
    expect(screen.getByTestId('post-image')).toBeInTheDocument();
  });

  it('renders an item with no topic chip, without throwing', () => {
    setup({ items: [{ ...post, topic: undefined }] });

    expect(screen.getByText(post.title)).toBeInTheDocument();
  });
});
