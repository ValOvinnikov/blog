import type { HTMLAttributes } from 'react';

import { postCardMetaVariants } from './post-card-meta-variants';

export const PostCardMeta = ({
  className,
  ...rest
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={postCardMetaVariants({ class: className })} {...rest} />
);
