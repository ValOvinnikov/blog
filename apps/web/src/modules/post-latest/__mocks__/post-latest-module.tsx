import type { TModuleComponentProps } from '@web/modules/module-renderer';
import { MOCK_POST_LATEST_STUB_TEST_ID } from '@web/testing/shared/module-renderer-contract/fixtures';

export const PostLatestModule = vi.fn(({ id }: TModuleComponentProps) => (
  <div data-testid={MOCK_POST_LATEST_STUB_TEST_ID}>{id}</div>
));
