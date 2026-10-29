import { toHeadingBlock } from '@blog/service/shared/transformers/heading-block/to-heading-block';
import { toLayout } from '@blog/service/shared/transformers/layout/to-layout';
import type { InferResultType } from 'groqd';

import type { cookieSettingsModuleQuery } from './query';
import type { TCookieSettingsModule } from './types';

export type TRawCookieSettingsModule = InferResultType<
  typeof cookieSettingsModuleQuery
>;

export function toCookieSettingsModule(
  raw: TRawCookieSettingsModule,
): TCookieSettingsModule {
  return {
    brandVariant: raw.brandVariant,
    headingBlock: toHeadingBlock(raw.headingBlock),
    layout: toLayout(raw.layout),
  };
}
