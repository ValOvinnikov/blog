import type { TBrandVariant } from '@blog/config/constants';
import { moduleSubtitle } from '@blog/studio/schema-types/preview/module-subtitle/module-subtitle';

export const limitPreview = {
  select: {
    title: 'title',
    brandVariant: 'brandVariant',
    limit: 'limit',
  },
  prepare: ({
    title,
    brandVariant,
    limit,
  }: {
    title?: string;
    brandVariant?: TBrandVariant;
    limit?: number;
  }) => ({
    title: title ?? 'Unknown',
    subtitle: moduleSubtitle(
      brandVariant,
      limit ? `Limit: ${String(limit)}` : undefined,
    ),
  }),
};
