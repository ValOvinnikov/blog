'use client';

import { NotFoundPage } from '@web/components/pages/not-found-page';
import { useVoiceRich } from '@web/context/voice-rich-provider';

/** Renders only inside `[tenant]/[locale]/layout.tsx`, whose providers supply its tenant-voiced copy. */
export const LocaleNotFoundPage = () => (
  <NotFoundPage supportingText={useVoiceRich('notFoundSupportingText')} />
);
