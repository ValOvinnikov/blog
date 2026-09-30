import {
  A_AS_CONST,
  type IWithClassName,
  type IWithDataTestId,
  SIZE,
} from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Avatar } from '@blog/ui/components/atoms/avatar';
import { MetaSeparator } from '@blog/ui/components/atoms/meta-separator';
import { type ReactNode } from 'react';

import { postMetaVariants } from './post-meta-variants';

export type TPostMetaProps = IWithClassName &
  IWithDataTestId & {
    author: {
      name: string;
      imageUrl?: string;
      href?: string;
    };
    publishedAt: string;
    formattedDate: string;
    readingTimeMinutes?: number;
    linkAs?: TAnchorElementType;
    share?: ReactNode;
  };

const s = postMetaVariants();

/** Post detail metadata strip: author avatar + name, publish date, and estimated reading time. */
export const PostMeta = ({
  author,
  publishedAt,
  formattedDate,
  readingTimeMinutes,
  linkAs,
  share,
  className,
  dataTestId,
}: TPostMetaProps) => {
  const LinkComponent = linkAs ?? A_AS_CONST;

  return (
    <div className={s.root({ class: className })} data-testid={dataTestId}>
      <span className={s.author()}>
        <Avatar
          name={author.name}
          alt=""
          src={author.imageUrl}
          size={SIZE.SM}
        />
        {author.href ? (
          <LinkComponent href={author.href} className={s.authorName()}>
            {author.name}
          </LinkComponent>
        ) : (
          <span className={s.authorName()}>{author.name}</span>
        )}
      </span>
      <MetaSeparator />
      <time dateTime={publishedAt}>{formattedDate}</time>
      {readingTimeMinutes !== undefined && (
        <>
          <MetaSeparator />
          <span>{readingTimeMinutes} min read</span>
        </>
      )}
      {share && <div className={s.share()}>{share}</div>}
    </div>
  );
};
