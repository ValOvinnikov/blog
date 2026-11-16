import type { TEmbedProvider, TMediaRatio } from '@shinefold/config/constants';

export type TParsedEmbed = {
  provider: TEmbedProvider;
  embedUrl: string;
  ratio: TMediaRatio;
};
