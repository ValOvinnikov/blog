'use client';

import type { TLocaleIsoCode } from '@blog/config/constants';
import type { TVoiceListSamples } from '@platform/components/features/site-preview/voice-specimen';
import { createContext, useContext, type ReactNode } from 'react';

type TVoiceListSamplesByLocale = Partial<
  Record<TLocaleIsoCode, TVoiceListSamples>
>;

const VoiceListSamplesContext = createContext<
  TVoiceListSamplesByLocale | undefined
>(undefined);

export type TVoiceListSamplesProviderProps = {
  samplesByLocale: TVoiceListSamplesByLocale;
  children: ReactNode;
};

export const VoiceListSamplesProvider = ({
  samplesByLocale,
  children,
}: TVoiceListSamplesProviderProps) => (
  <VoiceListSamplesContext.Provider value={samplesByLocale}>
    {children}
  </VoiceListSamplesContext.Provider>
);

export const useVoiceListSamples = (
  locale: TLocaleIsoCode,
): TVoiceListSamples => {
  const samples = useContext(VoiceListSamplesContext)?.[locale];
  if (!samples) {
    throw new Error(
      `useVoiceListSamples has no samples for ${locale}; wrap in a VoiceListSamplesProvider holding every live locale`,
    );
  }
  return samples;
};
