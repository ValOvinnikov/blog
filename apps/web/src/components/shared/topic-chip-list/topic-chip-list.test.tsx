import { customRender, screen } from '@web/testing/custom-render';
import {
  MOCK_DESIGN_TOPIC,
  MOCK_ENGINEERING_TOPIC,
  mockTopicWithPostCount,
} from '@web/testing/shared/topic/fixtures';

import { TopicChipList } from './topic-chip-list';

vi.mock('@web/i18n/navigation');

const ARIA_CURRENT = 'aria-current';
const NAV_NAME = 'Topics';
const ALL_CHIP_NAME = 'All';

const topics = [MOCK_ENGINEERING_TOPIC, MOCK_DESIGN_TOPIC];

const setup = customRender(TopicChipList, { topics });

describe(`<${TopicChipList.name}/>`, () => {
  describe('with default props', () => {
    beforeEach(() => {
      setup();
    });

    it('renders a Topics nav landmark', () => {
      const nav = screen.getByRole('navigation', { name: NAV_NAME });

      expect(nav).toBeVisible();
    });

    it('renders an "All" chip linking to the blog index', () => {
      const allLink = screen.getByRole('link', { name: ALL_CHIP_NAME });

      expect(allLink).toHaveAttribute('href', '/blog');
    });

    it.each(topics)(
      'renders a chip for $title linking to its archive',
      ({ title, slug }) => {
        const link = screen.getByRole('link', { name: title });

        expect(link).toHaveAttribute('href', `/topics/${slug}`);
      },
    );

    it('marks "All" as the current page when no activeSlug is given', () => {
      const allLink = screen.getByRole('link', { name: ALL_CHIP_NAME });
      const engineeringLink = screen.getByRole('link', {
        name: MOCK_ENGINEERING_TOPIC.title,
      });

      expect(allLink).toHaveAttribute(ARIA_CURRENT, 'page');
      expect(engineeringLink).not.toHaveAttribute(ARIA_CURRENT);
    });
  });

  it('renders nothing when there are no topics', () => {
    setup({ topics: [] });

    const nav = screen.queryByRole('navigation', { name: NAV_NAME });

    expect(nav).not.toBeInTheDocument();
  });

  it('marks the matching topic chip as the current page for an activeSlug', () => {
    setup({ activeSlug: MOCK_ENGINEERING_TOPIC.slug });

    const engineeringLink = screen.getByRole('link', {
      name: MOCK_ENGINEERING_TOPIC.title,
    });
    const allLink = screen.getByRole('link', { name: ALL_CHIP_NAME });
    const designLink = screen.getByRole('link', {
      name: MOCK_DESIGN_TOPIC.title,
    });

    expect(engineeringLink).toHaveAttribute(ARIA_CURRENT, 'page');
    expect(allLink).not.toHaveAttribute(ARIA_CURRENT);
    expect(designLink).not.toHaveAttribute(ARIA_CURRENT);
  });

  it('renders a topic with no archive page as plain text, never current', () => {
    const archivelessTopic = mockTopicWithPostCount({
      id: 'topic-4',
      title: 'Culture',
      slug: undefined,
    });
    setup({ topics: [...topics, archivelessTopic] });

    const chip = screen.getByText(archivelessTopic.title);
    const chipLink = screen.queryByRole('link', {
      name: archivelessTopic.title,
    });

    expect(chip).toBeVisible();
    expect(chip).not.toHaveAttribute(ARIA_CURRENT);
    expect(chipLink).not.toBeInTheDocument();
  });
});
