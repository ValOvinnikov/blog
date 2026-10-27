import type { TModuleComponentProps } from '@web/modules/module-renderer';
import { MOCK_CTA_STUB_TEST_ID } from '@web/testing/shared/module-renderer-contract/fixtures';

export const CtaModule = vi.fn(({ id }: TModuleComponentProps) => (
  <div data-testid={MOCK_CTA_STUB_TEST_ID}>{id}</div>
));
