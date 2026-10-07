import type { InferResultType } from 'groqd';

import type { landingPageParamsQuery } from './query';
import type { TLandingPageParam } from './types';

export type TRawLandingPageParams = InferResultType<
  typeof landingPageParamsQuery
>;

export function toLandingPageParams(
  raw: TRawLandingPageParams,
): TLandingPageParam[] {
  return raw.flatMap(({ slug, language }) =>
    slug === null ? [] : [{ slug, language }],
  );
}
