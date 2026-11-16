import type { TMaybeUndefined, TParsedEmbed } from '@shinefold/config/types';

export type TEmbedParser = (
  host: string,
  url: URL,
  segments: string[],
) => TMaybeUndefined<TParsedEmbed>;
