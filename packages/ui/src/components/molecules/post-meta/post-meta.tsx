import {
  type IWithClassName,
  type IWithDataTestId,
  SIZE,
} from '@shinefold/config';
import type { TAnchorElementType } from '@shinefold/config/react';
import { Avatar } from '@shinefold/ui/components/atoms/avatar';
import { MetaSeparator } from '@shinefold/ui/components/atoms/meta-separator';
import { TextLink } from '@shinefold/ui/components/atoms/text-link';
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
    readingTime?: string;
    linkAs?: TAnchorElementType;
    actions?: ReactNode;
  };

const s = postMetaVariants();

/** The byline under a post title: who wrote it, when, how long it takes to read, and the actions on it. */
export const PostMeta = ({
  author,
  publishedAt,
  formattedDate,
  readingTime,
  linkAs,
  actions,
  className,
  dataTestId,
}: TPostMetaProps) => (
  <div className={s.root({ class: className })} data-testid={dataTestId}>
    <span className={s.author()}>
      <Avatar name={author.name} alt="" src={author.imageUrl} size={SIZE.SM} />
      <TextLink
        href={author.href}
        as={linkAs}
        appearance="quiet"
        className={s.authorName()}
      >
        {author.name}
      </TextLink>
    </span>
    <MetaSeparator />
    <time dateTime={publishedAt}>{formattedDate}</time>
    {readingTime && (
      <>
        <MetaSeparator />
        <span>{readingTime}</span>
      </>
    )}
    {actions && <div className={s.actions()}>{actions}</div>}
  </div>
);
