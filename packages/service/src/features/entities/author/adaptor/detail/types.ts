import type { BlockText } from '@blog/types';

import type { TSocialLink } from '#/shared/transformers/to-social-link';

export type TAuthorDetail = {
  id: string;
  name: string;
  slug: string;
  role: string | undefined;
  imageUrl: string | undefined;
  bio: BlockText | undefined;
  socialLinks: TSocialLink[];
};
