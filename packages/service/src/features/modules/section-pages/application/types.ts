import type { TSectionPagesModuleDocument } from '@blog/service/features/modules/section-pages/adaptor/module/types';
import type { TSectionPageCard } from '@blog/service/features/modules/section-pages/adaptor/pages/types';

export type TSectionPagesModule = TSectionPagesModuleDocument & {
  pages: TSectionPageCard[];
};
