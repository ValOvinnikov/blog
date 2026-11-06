import type { TVoiceSurface } from '@blog/config';
import { useTranslations } from 'next-intl';

import { voiceSurfaceNoteVariants } from './voice-surface-note-variants';

export type TVoiceSurfaceNoteProps = {
  surface: TVoiceSurface;
  isClosingCard?: boolean;
};

export const VoiceSurfaceNote = ({
  surface,
  isClosingCard,
}: TVoiceSurfaceNoteProps) => {
  const t = useTranslations('voiceSurfaceNotes');

  return (
    <p className={voiceSurfaceNoteVariants({ isClosingCard })}>{t(surface)}</p>
  );
};
