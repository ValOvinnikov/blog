import { q } from '@shinefold/service/sanity/query/query';
import type { TRawModule } from '@shinefold/service/shared/transformers/module/to-module';

export const moduleFragment = q.fragment<TRawModule>().project(() => ({
  _id: true,
  _type: true,
}));
