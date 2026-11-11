import { Prose } from '@blog/ui/components/atoms/prose';
import { Article } from '@blog/ui/components/organisms/article';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ContentsRailLayout } from '@web/components/shared/contents-rail-layout';
import {
  createPostBodyOverride,
  PortableText,
} from '@web/components/shared/portable-text';
import { MOCK_CONTENTS_RAIL_BODY } from '@web/testing/shared/contents-rail/fixtures';
import { MOCK_FULL_BLEED_IMAGE_DEMO } from '@web/testing/shared/portable-text/fixtures';
import { MOCK_WIDE_TABLE_DEMO } from '@web/testing/shared/portable-text/wide-table-fixtures';

import { postArticleVariants } from './post-article-variants';

const s = postArticleVariants();
const postBodyComponents = createPostBodyOverride();

const meta = {
  title: 'Features/Post/PostArticleBody',
  parameters: { layout: 'fullscreen' },
  render: ({ body }) => (
    <Article>
      <Article.Body className={s.body()}>
        <ContentsRailLayout body={body}>
          <Prose className={s.prose()}>
            <PortableText value={body} components={postBodyComponents} />
          </Prose>
        </ContentsRailLayout>
      </Article.Body>
    </Article>
  ),
  args: { body: MOCK_FULL_BLEED_IMAGE_DEMO },
} satisfies Meta<{ body: typeof MOCK_FULL_BLEED_IMAGE_DEMO }>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const FullBleedImage: TStory = {};

export const FullBleedImageWithContentsRail: TStory = {
  args: { body: [...MOCK_CONTENTS_RAIL_BODY, ...MOCK_FULL_BLEED_IMAGE_DEMO] },
};

export const WideTableAndExpandableSection: TStory = {
  args: { body: MOCK_WIDE_TABLE_DEMO },
};

export const WideTableAndExpandableSectionWithContentsRail: TStory = {
  args: { body: [...MOCK_CONTENTS_RAIL_BODY, ...MOCK_WIDE_TABLE_DEMO] },
};
