import { customRender, screen } from '@web/testing/custom-render';

import { TopicChipList } from './topic-chip-list';

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

const topics = [
  {
    id: 'topic-1',
    title: 'Engineering',
    slug: 'engineering',
    description: undefined,
    postCount: 3,
  },
  {
    id: 'topic-2',
    title: 'Design',
    slug: 'design',
    description: undefined,
    postCount: 1,
  },
];

const setup = customRender(TopicChipList, { topics });

describe(`<${TopicChipList.name}/>`, () => {
  it('renders a Topics nav landmark', () => {
    setup();

    expect(screen.getByRole('navigation', { name: 'Topics' })).toBeVisible();
  });

  it('renders nothing when there are no topics', () => {
    setup({ topics: [] });

    expect(
      screen.queryByRole('navigation', { name: 'Topics' }),
    ).not.toBeInTheDocument();
  });

  it('renders an "All" chip linking to the blog index', () => {
    setup();

    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute(
      'href',
      '/blog',
    );
  });

  it('renders one chip per topic linking to its archive', () => {
    setup();

    expect(screen.getByRole('link', { name: 'Engineering' })).toHaveAttribute(
      'href',
      '/topics/engineering',
    );
    expect(screen.getByRole('link', { name: 'Design' })).toHaveAttribute(
      'href',
      '/topics/design',
    );
  });

  it('marks "All" as the current page when no activeSlug is given', () => {
    setup();

    expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('link', { name: 'Engineering' }),
    ).not.toHaveAttribute('aria-current');
  });

  it('marks the matching topic chip as the current page when activeSlug is given', () => {
    setup({ activeSlug: 'engineering' });

    expect(screen.getByRole('link', { name: 'Engineering' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'All' })).not.toHaveAttribute(
      'aria-current',
    );
    expect(screen.getByRole('link', { name: 'Design' })).not.toHaveAttribute(
      'aria-current',
    );
  });
});
