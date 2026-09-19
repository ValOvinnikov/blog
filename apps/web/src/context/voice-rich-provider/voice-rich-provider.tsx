'use client';

import type { TVoicePortableText } from '@blog/config';
import type { TVoiceRichFieldId } from '@web/utils/resolve-voice-rich-fields';
import { createContext, useContext, type ReactNode } from 'react';

type TVoiceRichValues = Record<TVoiceRichFieldId, TVoicePortableText>;

const VoiceRichContext = createContext<TVoiceRichValues | undefined>(undefined);

export interface IVoiceRichProviderProps {
  values: TVoiceRichValues;
  children: ReactNode;
}

/**
 * @example
 * <VoiceRichProvider values={rich}>
 *   <App />
 * </VoiceRichProvider>
 */
export const VoiceRichProvider = ({
  values,
  children,
}: IVoiceRichProviderProps) => (
  <VoiceRichContext.Provider value={values}>
    {children}
  </VoiceRichContext.Provider>
);

/** Reads a resolved RICH voice field from a client component — throws outside a `VoiceRichProvider`. */
export const useVoiceRich = (id: TVoiceRichFieldId): TVoicePortableText => {
  const context = useContext(VoiceRichContext);
  if (!context) {
    throw new Error('useVoiceRich must be used within a VoiceRichProvider');
  }
  return context[id];
};
