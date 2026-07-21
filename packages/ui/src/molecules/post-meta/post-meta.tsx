import type { IWithDataTestId } from '@blog/config';
import { Size } from '@blog/config';
import { Avatar } from '@blog/ui/atoms/avatar';
import { MetaSeparator } from '@blog/ui/atoms/meta-separator';
import type { IShareButtonsProps } from '@blog/ui/molecules/share-buttons';
import { ShareButtons } from '@blog/ui/molecules/share-buttons';

import { postMetaVariants } from './post-meta-variants';

export interface IPostMetaProps extends IWithDataTestId {
  author: {
    name: string;
    avatarUrl?: string;
  };
  /** ISO 8601 date string, used only for `<time dateTime>`. */
  publishedAt: string;
  /** Human-readable date string, pre-formatted in the web layer. */
  formattedDate: string;
  readingTimeMinutes?: number;
  /** Renders a share trigger + popover inline, right-aligned in the strip — omit to render `PostMeta` without a share action. `open`/`onOpenChange`/`isCopied`/`onCopyClick` remain fully controlled by whatever the web layer passes through here. */
  share?: IShareButtonsProps;
  className?: string;
}

const s = postMetaVariants();

/**
 * PostMeta — post detail metadata strip: author avatar + name, publish date,
 * and estimated reading time.
 */
export const PostMeta = ({
  author,
  publishedAt,
  formattedDate,
  readingTimeMinutes,
  share,
  className,
  dataTestId,
}: IPostMetaProps) => (
  <div className={s.root({ class: className })} data-testid={dataTestId}>
    <span className={s.author()}>
      <Avatar
        name={author.name}
        alt={author.name}
        src={author.avatarUrl}
        size={Size.SM}
      />
      <span className={s.authorName()}>{author.name}</span>
    </span>
    <MetaSeparator />
    <time dateTime={publishedAt}>{formattedDate}</time>
    {readingTimeMinutes !== undefined && (
      <>
        <MetaSeparator />
        <span>{readingTimeMinutes} min read</span>
      </>
    )}
    {share && (
      <ShareButtons
        {...share}
        className={s.share({ class: share.className })}
      />
    )}
  </div>
);
