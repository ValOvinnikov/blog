import { faker } from '@faker-js/faker';
import { customRender, screen } from '@shinefold/ui/testing/custom-render';
import { MOCK_TOPIC } from '@shinefold/ui/testing/fixtures';
import { MOCK_LINK_TEST_ID, MockLink } from '@shinefold/ui/testing/mock-link';

import { TaxonomyCard } from './taxonomy-card';

faker.seed(123);

const MOCK_DESCRIPTION = faker.lorem.sentence();
const MOCK_POST_COUNT_LABEL = `${faker.number.int({ min: 2, max: 40 })} posts`;
const MOCK_POSTS_LABEL = faker.lorem.words(2);
const MOCK_POSTS = faker.helpers.multiple(
  () => ({
    id: faker.string.uuid(),
    title: faker.lorem.words(3),
    href: `/posts/${faker.lorem.slug()}`,
  }),
  { count: 2 },
);

const setup = customRender(TaxonomyCard, {
  title: MOCK_TOPIC.label,
  href: MOCK_TOPIC.href,
  postCountLabel: MOCK_POST_COUNT_LABEL,
  headingLevel: 2 as const,
});

describe(`<${TaxonomyCard.name}/>`, () => {
  it('renders the title as a heading at the given level, linking to href', () => {
    setup({ headingLevel: 3 });

    const heading = screen.getByRole('heading', { level: 3 });
    const link = screen.getByRole('link');

    expect(heading).toContainElement(link);
    expect(link).toHaveAttribute('href', MOCK_TOPIC.href);
  });

  it('renders the description', () => {
    setup({ description: MOCK_DESCRIPTION });

    const description = screen.getByText(MOCK_DESCRIPTION);

    expect(description).toBeVisible();
  });

  describe('with the required props only', () => {
    beforeEach(() => {
      setup();
    });

    it('renders no description when omitted', () => {
      const description = screen.queryByText(MOCK_DESCRIPTION);

      expect(description).not.toBeInTheDocument();
    });

    it('renders the pre-formatted post count label as visible text', () => {
      const postCount = screen.getByText(MOCK_POST_COUNT_LABEL);

      expect(postCount).toBeVisible();
    });

    it('names the link by the visible title followed by the post count', () => {
      const link = screen.getByRole('link');

      expect(link).toHaveAccessibleName(
        `${MOCK_TOPIC.label}, ${MOCK_POST_COUNT_LABEL}`,
      );
    });
  });

  it('renders the link through the supplied link component', () => {
    setup({ linkAs: MockLink });

    const mockLink = screen.getByTestId(MOCK_LINK_TEST_ID);

    expect(mockLink).toBeVisible();
  });

  it('renders its posts as a labelled list of post links', () => {
    setup({
      children: (
        <TaxonomyCard.Posts ariaLabel={MOCK_POSTS_LABEL} posts={MOCK_POSTS} />
      ),
    });

    const postList = screen.getByRole('list', { name: MOCK_POSTS_LABEL });

    expect(postList).toBeVisible();
    for (const { title, href } of MOCK_POSTS) {
      const postLink = screen.getByRole('link', { name: title });

      expect(postLink).toHaveAttribute('href', href);
    }
  });

  it('renders no list when there are no posts', () => {
    setup({
      children: <TaxonomyCard.Posts ariaLabel={MOCK_POSTS_LABEL} posts={[]} />,
    });

    const postList = screen.queryByRole('list');

    expect(postList).not.toBeInTheDocument();
  });
});
