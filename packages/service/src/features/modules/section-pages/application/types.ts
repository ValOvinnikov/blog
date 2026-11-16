import type { TSectionPagesModuleDocument } from '@shinefold/service/features/modules/section-pages/adaptor/module/types';
import type { TSectionPageCard } from '@shinefold/service/features/modules/section-pages/adaptor/pages/types';

export type TSectionPagesModule = TSectionPagesModuleDocument & {
  pages: TSectionPageCard[];
};
