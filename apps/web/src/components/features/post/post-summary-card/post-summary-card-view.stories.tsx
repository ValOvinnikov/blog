import { SITE_MESSAGES } from '@shinefold/config';
import { Prose } from '@shinefold/ui/components/atoms/prose';
import { Article } from '@shinefold/ui/components/organisms/article';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PostSummaryButton } from '@web/components/features/post/post-summary-button';
import { PostSummaryProvider } from '@web/context/post-summary-provider';
import {
  MOCK_POST_DETAIL,
  MOCK_POST_DETAIL_BODY_TEXT,
  MOCK_POST_TAKEAWAYS,
} from '@web/testing/pages/blog-post-page/fixtures';
import { userEvent, within } from 'storybook/test';

import { PostSummaryCardView } from './post-summary-card-view';

const { title, excerpt, author, publishedAt, readingTimeMinutes } =
  MOCK_POST_DETAIL;
const {
  button: summaryLabel,
  title: summaryTitle,
  readTime,
  readFullArticle,
} = SITE_MESSAGES.blogPostPage.postSummary;

const meta = {
  title: 'Features/Post/PostSummaryCardView',
  component: PostSummaryCardView,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  args: {
    takeaways: MOCK_POST_TAKEAWAYS,
    title: summaryTitle,
    readTime,
    readFullArticleLabel: readFullArticle.replace(
      '{count}',
      String(readingTimeMinutes),
    ),
  },
  render: (args) => (
    <PostSummaryProvider>
      <Article>
        <Article.Header
          title={title}
          lead={excerpt}
          meta={{
            author: { name: author.name },
            publishedAt,
            formattedDate: publishedAt,
            readingTime: `${readingTimeMinutes} min read`,
            actions: <PostSummaryButton label={summaryLabel} />,
          }}
          belowMeta={<PostSummaryCardView {...args} />}
        />
        <Article.Body>
          <Prose>
            <p>{MOCK_POST_DETAIL_BODY_TEXT}</p>
          </Prose>
        </Article.Body>
      </Article>
    </PostSummaryProvider>
  ),
} satisfies Meta<typeof PostSummaryCardView>;

export default meta;
type TStory = StoryObj<typeof meta>;

const openSummary: TStory['play'] = async ({ canvasElement }) => {
  const canvas = within(canvasElement);
  await userEvent.click(
    await canvas.findByRole('button', { name: summaryLabel }),
  );
};

export const Closed: TStory = {};

export const Open: TStory = { play: openSummary };

export const ClosedDark: TStory = { globals: { colorMode: 'dark' } };

export const OpenDark: TStory = {
  globals: { colorMode: 'dark' },
  play: openSummary,
};

export const OpenOnPhone: TStory = {
  globals: { viewport: 'mobile' },
  play: openSummary,
};
