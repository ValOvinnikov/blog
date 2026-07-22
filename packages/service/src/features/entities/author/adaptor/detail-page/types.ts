import type { BlockText, TMaybeUndefined } from '@blog/config';
import type { TSocialLink } from '@blog/service/shared/transformers/to-social-link';

export type TAuthorDetail = {
  id: string;
  name: string;
  slug: string;
  role: TMaybeUndefined<string>;
  imageUrl: TMaybeUndefined<string>;
  bio: TMaybeUndefined<BlockText>;
  socialLinks: TSocialLink[];
};
