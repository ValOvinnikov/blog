import { Prose } from '@blog/ui/components/atoms/prose';
import { Article } from '@blog/ui/components/organisms/article';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PortableText } from '@web/components/shared/portable-text';
import { fullBleedImageDemo } from '@web/testing/shared/portable-text/fixtures';

import { postArticleVariants } from './post-article-variants';

const s = postArticleVariants();

const meta = {
  title: 'Features/Post/PostArticleBody',
  parameters: { layout: 'fullscreen' },
  render: ({ body }) => (
    <Article>
      <Article.Body className={s.body()}>
        <Prose className={s.prose()}>
          <PortableText value={body} />
        </Prose>
      </Article.Body>
    </Article>
  ),
  args: { body: fullBleedImageDemo },
} satisfies Meta<{ body: typeof fullBleedImageDemo }>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const FullBleedImage: TStory = {};

const withRail = postArticleVariants({ withRail: true });

export const FullBleedImageWithContentsRail: TStory = {
  render: ({ body }) => (
    <Article>
      <Article.Body className={withRail.body()}>
        <nav className={withRail.rail()} aria-label="Contents">
          Contents rail
        </nav>
        <div className={withRail.content()}>
          <Prose className={withRail.prose()}>
            <PortableText value={body} />
          </Prose>
        </div>
      </Article.Body>
    </Article>
  ),
};
