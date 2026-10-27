import type { TModuleComponentProps } from '@web/modules/module-renderer';
import { MOCK_TAXONOMY_LIST_STUB_TEST_ID } from '@web/testing/shared/module-renderer-contract/fixtures';

export const TaxonomyListModule = vi.fn(({ id }: TModuleComponentProps) => (
  <div data-testid={MOCK_TAXONOMY_LIST_STUB_TEST_ID}>{id}</div>
));
