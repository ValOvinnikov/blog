import type { IWithDataTestId } from '@blog/config';
import { Size } from '@blog/config';
import { Avatar } from '@blog/ui/atoms/avatar';
import { MetaSeparator } from '@blog/ui/atoms/meta-separator';
import type { ReactNode } from 'react';

import { postMetaVariants } from './post-meta-variants';

export interface IPostMetaProps extends IWithDataTestId {
  author: {
    name: string;
    imageUrl?: string;
  };
  /** ISO 8601 date string, used only for `<time dateTime>`. */
  publishedAt: string;
  /** Human-readable date string, pre-formatted in the web layer. */
  formattedDate: string;
  readingTimeMinutes?: number;
  /** Opaque share widget, right-aligned in the strip — omit to render `PostMeta` without a share action. `PostMeta` knows nothing about its contents or state; the interactive widget is built in `apps/web` and passed in. */
  share?: ReactNode;
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
        src={author.imageUrl}
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
    {share && <span className={s.share()}>{share}</span>}
  </div>
);
