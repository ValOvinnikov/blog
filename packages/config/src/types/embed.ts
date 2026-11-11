import type { TEmbedProvider, TMediaRatio } from '@blog/config/constants';

export type TParsedEmbed = {
  provider: TEmbedProvider;
  embedUrl: string;
  ratio: TMediaRatio;
};
