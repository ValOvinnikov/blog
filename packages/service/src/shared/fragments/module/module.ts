import { q } from '@blog/service/sanity/query';
import type { TRawModule } from '@blog/service/shared/transformers/module/to-module/to-module';

export const moduleFragment = q.fragment<TRawModule>().project(() => ({
  _id: true,
  _type: true,
}));
