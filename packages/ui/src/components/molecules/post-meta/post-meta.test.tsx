import { customRender, screen } from '@blog/ui/testing/custom-render';
import {
  MOCK_FORMATTED_DATE,
  MOCK_PERSON_NAME,
  MOCK_PUBLISHED_AT,
} from '@blog/ui/testing/fixtures';
import { MOCK_LINK_TEST_ID, MockLink } from '@blog/ui/testing/mock-link';
import { faker } from '@faker-js/faker';

import { PostMeta } from './post-meta';

faker.seed(123);

const author = {
  name: MOCK_PERSON_NAME,
  imageUrl: faker.image.avatarGitHub(),
};
const readingTime = `${faker.number.int({ min: 3, max: 15 })} min read`;
const MOCK_SHARE_LABEL = faker.lorem.word();

const setup = customRender(PostMeta, {
  author,
  publishedAt: MOCK_PUBLISHED_AT,
  formattedDate: MOCK_FORMATTED_DATE,
});

describe(`<${PostMeta.name}/>`, () => {
  let authorHref: string;

  beforeEach(() => {
    authorHref = `/authors/${faker.lorem.slug()}`;
  });

  describe('with the default props', () => {
    beforeEach(() => {
      setup();
    });

    it('announces the author name once, beside its avatar image', () => {
      const authorNames = screen.getAllByText(author.name);
      const avatarImage = screen.queryByRole('img');

      expect(authorNames).toHaveLength(1);
      expect(avatarImage).not.toBeInTheDocument();
    });

    it('renders the date as a time element carrying the publish timestamp', () => {
      const timeEl = screen.getByText(MOCK_FORMATTED_DATE);

      expect(timeEl).toBeVisible();
      expect(timeEl.tagName).toBe('TIME');
      expect(timeEl).toHaveAttribute('dateTime', MOCK_PUBLISHED_AT);
    });

    it('omits the reading time', () => {
      const readingTimeText = screen.queryByText(readingTime);

      expect(readingTimeText).not.toBeInTheDocument();
    });

    it('omits the share trigger', () => {
      const shareButton = screen.queryByRole('button', { name: /share/i });

      expect(shareButton).not.toBeInTheDocument();
    });

    it('renders the author name as plain text, not a link', () => {
      const authorLink = screen.queryByRole('link', { name: author.name });

      expect(authorLink).not.toBeInTheDocument();
    });
  });

  it('renders reading time when provided', () => {
    setup({ readingTime });
    const readingTimeText = screen.getByText(readingTime);

    expect(readingTimeText).toBeVisible();
  });

  it('falls back to initials without an image, announcing the name once', () => {
    setup({ author: { name: author.name } });
    const avatarImage = screen.queryByRole('img');
    const authorNames = screen.getAllByText(author.name);

    expect(avatarImage).not.toBeInTheDocument();
    expect(authorNames).toHaveLength(1);
  });

  it('renders the share slot', () => {
    setup({ share: <button>{MOCK_SHARE_LABEL}</button> });
    const shareButton = screen.getByRole('button', { name: MOCK_SHARE_LABEL });

    expect(shareButton).toBeVisible();
  });

  it('renders the author name as a link to the author page', () => {
    setup({ author: { ...author, href: authorHref } });
    const authorLink = screen.getByRole('link', { name: author.name });

    expect(authorLink).toHaveAttribute('href', authorHref);
  });

  it('renders the author link through the supplied link component', () => {
    setup({
      author: { ...author, href: authorHref },
      linkAs: MockLink,
    });
    const authorLink = screen.getByRole('link', { name: author.name });
    const mockLink = screen.getByTestId(MOCK_LINK_TEST_ID);

    expect(authorLink).toBe(mockLink);
  });
});
