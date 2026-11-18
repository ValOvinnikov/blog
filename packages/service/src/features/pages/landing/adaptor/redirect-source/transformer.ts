import type { InferResultType } from 'groqd';

import type { redirectSourceQuery } from './query';
import type { TLandingRedirectSource } from './types';

export type TRawRedirectSource = NonNullable<
  InferResultType<typeof redirectSourceQuery>
>;

export function toLandingRedirectSource({
  source,
  language,
  isPrefix,
}: TRawRedirectSource): TLandingRedirectSource {
  return { source, language, isPrefix: isPrefix ?? false };
}
