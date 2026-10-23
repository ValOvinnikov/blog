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
      expect(screen.getAllByText(author.name)).toHaveLength(1);
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });

    it('renders a time element with the correct dateTime attribute and label', () => {
      const timeEl = screen.getByText(MOCK_FORMATTED_DATE);
      expect(timeEl).toBeVisible();
      expect(timeEl.tagName).toBe('TIME');
      expect(timeEl).toHaveAttribute('dateTime', MOCK_PUBLISHED_AT);
    });

    it('omits reading time segment when not provided', () => {
      expect(screen.queryByText(readingTime)).not.toBeInTheDocument();
    });

    it('omits the share trigger when share is not provided', () => {
      expect(
        screen.queryByRole('button', { name: /share/i }),
      ).not.toBeInTheDocument();
    });

    it('renders the author name as plain text when href is not provided', () => {
      expect(
        screen.queryByRole('link', { name: author.name }),
      ).not.toBeInTheDocument();
    });
  });

  it('renders reading time when provided', () => {
    setup({ readingTime });
    expect(screen.getByText(readingTime)).toBeVisible();
  });

  it('falls back to initials when imageUrl is not provided, announcing the name once', () => {
    setup({ author: { name: author.name } });
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.getAllByText(author.name)).toHaveLength(1);
  });

  it('forwards dataTestId to root element', () => {
    setup({ dataTestId: 'post-meta' });
    expect(screen.getByTestId('post-meta')).toBeVisible();
  });

  it('renders the share slot when share is provided', () => {
    setup({ share: <button>share</button> });
    expect(screen.getByRole('button', { name: 'share' })).toBeVisible();
  });

  it('renders the author name as a link to its href when provided', () => {
    setup({ author: { ...author, href: authorHref } });
    expect(screen.getByRole('link', { name: author.name })).toHaveAttribute(
      'href',
      authorHref,
    );
  });

  it('renders the author link as the linkAs component when provided', () => {
    setup({
      author: { ...author, href: authorHref },
      linkAs: MockLink,
    });
    expect(screen.getByRole('link', { name: author.name })).toBe(
      screen.getByTestId(MOCK_LINK_TEST_ID),
    );
  });
});
