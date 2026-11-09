import { routes } from '@blog/config';
import type { TSectionIndexType } from '@blog/service';

const SECTION_INDEX_HREF = {
  page_privacyIndex: routes.privacy,
  page_legalIndex: routes.legal,
} satisfies Record<TSectionIndexType, () => string>;

export const sectionIndexHref = (type: TSectionIndexType): string =>
  SECTION_INDEX_HREF[type]();
