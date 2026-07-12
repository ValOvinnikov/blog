import type { BlockText } from '@blog/config';
import type { TSocialLink } from '@blog/service/shared/transformers/to-social-link';

export type TAuthorDetail = {
  id: string;
  name: string;
  slug: string;
  role: string | undefined;
  imageUrl: string | undefined;
  bio: BlockText | undefined;
  socialLinks: TSocialLink[];
};
