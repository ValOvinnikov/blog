import type { TMaybeNull, TMaybeUndefined } from '@shinefold/config/types';
import {
  PAGE_POST_TYPE,
  POST_TAKEAWAYS_FIELD,
} from '@shinefold/studio/schema-types/documents/pages/post/post-type';
import { isPlainObject, isString } from '@shinefold/utils/primitives';
import type { DocumentBadgeComponent, SanityDocument } from 'sanity';

const summaryGeneratedAt = (
  document: TMaybeNull<SanityDocument>,
): TMaybeUndefined<string> => {
  const takeaways: unknown = document?.[POST_TAKEAWAYS_FIELD];
  if (!isPlainObject(takeaways)) return undefined;
  const { generatedAt } = takeaways;
  return isString(generatedAt) ? generatedAt : undefined;
};

export const SummaryReviewBadge: DocumentBadgeComponent = ({
  type,
  draft,
  published,
}) => {
  if (type !== PAGE_POST_TYPE) return null;
  const generatedAt = summaryGeneratedAt(draft);
  return generatedAt && generatedAt !== summaryGeneratedAt(published)
    ? {
        label: 'Summary to review',
        title:
          'A summary was generated for this post. Review it under Summary — publishing approves it.',
        color: 'primary',
      }
    : null;
};
