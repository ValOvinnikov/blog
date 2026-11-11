import type { TMaybeUndefined, TParsedEmbed } from '@blog/config/types';

export type TEmbedParser = (
  host: string,
  url: URL,
  segments: string[],
) => TMaybeUndefined<TParsedEmbed>;
