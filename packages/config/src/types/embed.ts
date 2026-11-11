import type { TEmbedProvider, TEmbedRatio } from '@blog/config/constants';

export type TParsedEmbed = {
  provider: TEmbedProvider;
  embedUrl: string;
  ratio: TEmbedRatio;
};
