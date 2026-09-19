import { type IWithClassName, type IWithDataTestId, SIZE } from '@blog/config';
import type { TAnchorElementType } from '@blog/config/react';
import { Avatar } from '@blog/ui/atoms/avatar';
import { MetaSeparator } from '@blog/ui/atoms/meta-separator';
import { resolveComponent } from '@blog/ui/lib/react';
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
  const LinkComponent = resolveComponent(linkAs, 'a');

  return (
    <div className={s.root({ class: className })} data-testid={dataTestId}>
      <span className={s.author()}>
        <Avatar
          name={author.name}
          alt={author.name}
          src={author.imageUrl}
          size={SIZE.SM}
        />
        {author.href ? (
          // eslint-disable-next-line react-hooks/static-components -- resolveComponent returns `linkAs`/fallback verbatim, so the reference stays stable across renders
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
