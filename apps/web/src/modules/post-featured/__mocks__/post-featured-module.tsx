import type { TModuleComponentProps } from '@web/modules/module-renderer';
import { MOCK_POST_FEATURED_STUB_TEST_ID } from '@web/testing/shared/module-renderer-contract/fixtures';

export const PostFeaturedModule = vi.fn(({ id }: TModuleComponentProps) => (
  <div data-testid={MOCK_POST_FEATURED_STUB_TEST_ID}>{id}</div>
));
