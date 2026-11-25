import { toModuleHeadingBlock } from '@shinefold/service/shared/transformers/heading-block/to-module-heading-block';
import { toLayout } from '@shinefold/service/shared/transformers/layout/to-layout';
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
    headingBlock: toModuleHeadingBlock(raw.headingBlock),
    layout: toLayout(raw.layout),
  };
}
