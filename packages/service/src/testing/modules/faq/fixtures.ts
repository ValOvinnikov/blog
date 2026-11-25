import { BRAND_VARIANT } from '@shinefold/config';
import type { TRawFaqModule } from '@shinefold/service/features/modules/faq/adaptor/transformer';
import {
  MOCK_SECOND_FAQ_QUESTION_ID,
  mockRawFaqQuestionItem,
} from '@shinefold/service/testing/modules/fixtures';
import { mockRawModuleHeadingBlock } from '@shinefold/service/testing/shared/localized';
import { mockRawModuleAppearance } from '@shinefold/service/testing/shared/module-appearance';

export function mockRawFaqModule(
  overrides: Partial<TRawFaqModule> = {},
): TRawFaqModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawModuleHeadingBlock('Frequently asked questions'),
    questions: [
      mockRawFaqQuestionItem(),
      mockRawFaqQuestionItem({ _id: MOCK_SECOND_FAQ_QUESTION_ID }),
    ],
    ctaButtons: null,
    contentAlignment: null,
    layout: null,
    ...mockRawModuleAppearance(),
    ...overrides,
  };
}
