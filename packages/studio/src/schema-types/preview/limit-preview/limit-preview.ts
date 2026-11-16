import type { TBrandVariant } from '@shinefold/config/constants';
import { moduleSubtitle } from '@shinefold/studio/schema-types/preview/module-subtitle/module-subtitle';

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
