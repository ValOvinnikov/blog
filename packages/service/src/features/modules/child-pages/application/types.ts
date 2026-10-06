import type { TChildPagesModuleDocument } from '@blog/service/features/modules/child-pages/adaptor/module/types';
import type { TChildPageCard } from '@blog/service/features/modules/child-pages/adaptor/pages/types';

export type TChildPagesModule = TChildPagesModuleDocument & {
  pages: TChildPageCard[];
};
