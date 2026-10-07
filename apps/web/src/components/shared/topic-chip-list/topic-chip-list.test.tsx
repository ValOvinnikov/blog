import { customRender, screen } from '@web/testing/custom-render';

import { TopicChipList } from './topic-chip-list';

vi.mock('@web/i18n/navigation');

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
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a Topics nav landmark', () => {
      expect(screen.getByRole('navigation', { name: 'Topics' })).toBeVisible();
    });

    it('renders an "All" chip linking to the blog index', () => {
      expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute(
        'href',
        '/blog',
      );
    });

    it('renders one chip per topic linking to its archive', () => {
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
      expect(screen.getByRole('link', { name: 'All' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      expect(
        screen.getByRole('link', { name: 'Engineering' }),
      ).not.toHaveAttribute('aria-current');
    });
  });

  it('renders nothing when there are no topics', () => {
    setup({ topics: [] });

    expect(
      screen.queryByRole('navigation', { name: 'Topics' }),
    ).not.toBeInTheDocument();
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

  it('renders a topic with no archive page as plain text, never current', () => {
    setup({
      topics: [
        ...topics,
        {
          id: 'topic-3',
          title: 'Culture',
          slug: undefined,
          description: undefined,
          postCount: 2,
        },
      ],
    });

    const chip = screen.getByText('Culture');
    expect(chip).toBeVisible();
    expect(chip).not.toHaveAttribute('aria-current');
    expect(
      screen.queryByRole('link', { name: 'Culture' }),
    ).not.toBeInTheDocument();
  });
});
