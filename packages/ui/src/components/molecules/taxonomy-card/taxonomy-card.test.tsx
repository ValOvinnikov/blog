import { customRender, screen } from '@blog/ui/testing/custom-render';
import { MOCK_TOPIC } from '@blog/ui/testing/fixtures';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';
import { faker } from '@faker-js/faker';

import { TaxonomyCard } from './taxonomy-card';

const DESCRIPTION = 'Posts about building things.';
const TAXONOMY_CARD_TEST_ID = 'taxonomy-card';
const FIRST_POST_TITLE = 'First post';
const FIRST_POST_HREF = '/posts/first';
const SECOND_POST_TITLE = 'Second post';
const SECOND_POST_HREF = '/posts/second';

faker.seed(123);

const setup = customRender(TaxonomyCard, {
  title: faker.lorem.words(2),
  href: `/topics/${faker.lorem.slug()}`,
  postCountLabel: '5 posts',
  headingLevel: 2 as const,
});

describe(`<${TaxonomyCard.name}/>`, () => {
  it('renders the title as a heading at the given level, linking to href', () => {
    const title = faker.lorem.words(3);
    const href = `/topics/${faker.lorem.slug()}`;
    setup({ title, href, headingLevel: 3 });

    const heading = screen.getByRole('heading', { level: 3 });
    const link = screen.getByRole('link');
    expect(heading).toContainElement(link);
    expect(link).toHaveAttribute('href', href);
  });

  it('renders description when provided', () => {
    setup({ description: DESCRIPTION });
    expect(screen.getByText(DESCRIPTION)).toBeVisible();
  });

  it('does not render a description element when omitted', () => {
    setup();
    expect(screen.queryByText(/posts about/i)).not.toBeInTheDocument();
  });

  it('renders the pre-formatted post count label as visible text', () => {
    setup({ postCountLabel: '1 post' });
    expect(screen.getByText('1 post')).toBeVisible();
  });

  it('names the link by the visible title followed by the post count', () => {
    setup({ title: MOCK_TOPIC.label, postCountLabel: '5 posts' });
    const link = screen.getByRole('link');
    expect(link).toHaveAccessibleName(`${MOCK_TOPIC.label}, 5 posts`);
  });

  it('honours a custom accessibleNameSeparator when composing the accessible name', () => {
    setup({
      title: MOCK_TOPIC.label,
      postCountLabel: '5 posts',
      accessibleNameSeparator: ' — ',
    });
    expect(
      screen.getByRole('link', { name: `${MOCK_TOPIC.label} — 5 posts` }),
    ).toBeVisible();
  });

  it('renders the link via the linkAs component when provided', () => {
    setup({ linkAs: MockLink });

    expect(screen.getByTestId(MOCK_LINK_TEST_ID)).toBeVisible();
  });

  it('forwards data-testid to the root element', () => {
    setup({ dataTestId: TAXONOMY_CARD_TEST_ID });
    expect(screen.getByTestId(TAXONOMY_CARD_TEST_ID)).toBeVisible();
  });

  it('renders TaxonomyCard.Posts as a labelled list of post links', () => {
    setup({
      children: (
        <TaxonomyCard.Posts
          ariaLabel="Latest posts"
          posts={[
            { id: '1', title: FIRST_POST_TITLE, href: FIRST_POST_HREF },
            { id: '2', title: SECOND_POST_TITLE, href: SECOND_POST_HREF },
          ]}
        />
      ),
    });

    expect(screen.getByRole('list', { name: 'Latest posts' })).toBeVisible();
    expect(
      screen.getByRole('link', { name: FIRST_POST_TITLE }),
    ).toHaveAttribute('href', FIRST_POST_HREF);
    expect(
      screen.getByRole('link', { name: SECOND_POST_TITLE }),
    ).toHaveAttribute('href', SECOND_POST_HREF);
  });

  it('renders nothing for TaxonomyCard.Posts when posts is empty', () => {
    setup({
      children: <TaxonomyCard.Posts ariaLabel="Latest posts" posts={[]} />,
    });

    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('resolves a post link to its own href rather than the taxonomy term href', () => {
    setup({
      href: MOCK_TOPIC.href,
      children: (
        <TaxonomyCard.Posts
          ariaLabel="Latest posts"
          posts={[{ id: '1', title: FIRST_POST_TITLE, href: FIRST_POST_HREF }]}
        />
      ),
    });

    const postLink = screen.getByRole('link', { name: FIRST_POST_TITLE });
    expect(postLink).toHaveAttribute('href', FIRST_POST_HREF);
  });
});
