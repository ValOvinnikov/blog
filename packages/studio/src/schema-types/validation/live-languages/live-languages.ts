import type { TLocaleIsoCode } from '@blog/config/constants';

let liveLanguages: readonly TLocaleIsoCode[] = [];

export const setLiveLanguages = (languages: readonly TLocaleIsoCode[]) => {
  liveLanguages = languages;
};

export const getLiveLanguages = () => liveLanguages;
