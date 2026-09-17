import { q } from '@blog/service/sanity/query';
import type { TRawModule } from '@blog/service/shared/transformers/to-module';

/** Projects a dereferenced module reference down to its identity (`_id`/`_type`); call sites narrow `T` via `.as<TRawModule<T>>()`. */
export const moduleFragment = q.fragment<TRawModule>().project(() => ({
  _id: true,
  _type: true,
}));
