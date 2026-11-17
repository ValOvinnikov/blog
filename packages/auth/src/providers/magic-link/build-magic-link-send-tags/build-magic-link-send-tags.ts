import type { TMaybeUndefined } from '@shinefold/config';
import {
  buildPlatformEmailTag,
  buildSiteEmailTag,
  type TEmailTag,
} from '@shinefold/email';

export function buildMagicLinkSendTags(
  isSentByPlatform: boolean,
  readerSiteId: TMaybeUndefined<string>,
): TMaybeUndefined<TEmailTag[]> {
  if (isSentByPlatform) return [buildPlatformEmailTag()];
  return readerSiteId ? [buildSiteEmailTag(readerSiteId)] : undefined;
}
