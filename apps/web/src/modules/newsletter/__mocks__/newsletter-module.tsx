import type { TModuleComponentProps } from '@web/modules/module-renderer';
import { MOCK_NEWSLETTER_STUB_TEST_ID } from '@web/testing/shared/module-renderer-contract/fixtures';

export const NewsletterModule = vi.fn(({ id }: TModuleComponentProps) => (
  <div data-testid={MOCK_NEWSLETTER_STUB_TEST_ID}>{id}</div>
));
