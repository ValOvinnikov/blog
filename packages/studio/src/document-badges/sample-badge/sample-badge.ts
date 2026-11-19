import { STARTER_DOCUMENT_ID_PREFIX } from '@shinefold/config/constants';
import type { DocumentBadgeComponent } from 'sanity';

export const SampleBadge: DocumentBadgeComponent = ({ id }) =>
  id.startsWith(STARTER_DOCUMENT_ID_PREFIX)
    ? {
        label: 'Sample',
        title: 'Starter content — replace or delete it',
        color: 'warning',
      }
    : null;
