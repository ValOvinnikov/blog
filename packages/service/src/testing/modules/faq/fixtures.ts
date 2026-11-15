import { BRAND_VARIANT } from '@blog/config';
import type { TRawFaqModule } from '@blog/service/features/modules/faq/adaptor/transformer';
import {
  MOCK_SECOND_FAQ_QUESTION_ID,
  mockRawFaqQuestionItem,
} from '@blog/service/testing/modules/fixtures';
import { mockRawHeadingBlock } from '@blog/service/testing/shared/fixtures';
import { mockRawModuleAppearance } from '@blog/service/testing/shared/module-appearance';

export function mockRawFaqModule(
  overrides: Partial<TRawFaqModule> = {},
): TRawFaqModule {
  return {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: mockRawHeadingBlock('Frequently asked questions'),
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
