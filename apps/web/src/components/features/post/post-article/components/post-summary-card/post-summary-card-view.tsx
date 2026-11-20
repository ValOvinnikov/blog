import { ICONS, SIZE, TEXT_ROLE } from '@shinefold/config';
import type { TPostTakeaways } from '@shinefold/service';
import { Heading } from '@shinefold/ui/components/atoms/heading';
import { Icon } from '@shinefold/ui/components/atoms/icon';
import { Prose } from '@shinefold/ui/components/atoms/prose';
import { Text } from '@shinefold/ui/components/atoms/text';

import { PostSummaryPanel } from './components/post-summary-panel/post-summary-panel';
import { ReadFullArticleButton } from './components/read-full-article-button/read-full-article-button';
import { postSummaryCardVariants } from './post-summary-card-variants';

export interface IPostSummaryCardViewProps {
  takeaways: TPostTakeaways;
  title: string;
  readTime: string;
  readFullArticleLabel: string;
}

const s = postSummaryCardVariants();

export const PostSummaryCardView = ({
  takeaways,
  title,
  readTime,
  readFullArticleLabel,
}: IPostSummaryCardViewProps) => (
  <PostSummaryPanel ariaLabel={title} className={s.root()}>
    <div className={s.header()}>
      <Heading level={2} visual={TEXT_ROLE.CARD_TITLE}>
        {title}
      </Heading>
      <Text textRole={TEXT_ROLE.META} className={s.time()}>
        <Icon name={ICONS.CLOCK} size={SIZE.SM} />
        {readTime}
      </Text>
    </div>
    <Prose className={s.body()}>
      <ul className={s.list()}>
        {takeaways.takeaways.map((takeaway, index) => (
          <li key={index}>{takeaway}</li>
        ))}
      </ul>
    </Prose>
    <ReadFullArticleButton label={readFullArticleLabel} />
  </PostSummaryPanel>
);
