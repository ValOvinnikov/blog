import type { TModuleComponentProps } from '@web/modules/module-renderer';
import { MOCK_HERO_STUB_TEST_ID } from '@web/testing/shared/module-renderer-contract/fixtures';
import type { ReactNode } from 'react';

export const HeroBlogModule = vi.fn(
  async ({ id }: TModuleComponentProps): Promise<ReactNode> => (
    <h1 data-testid={MOCK_HERO_STUB_TEST_ID}>{id}</h1>
  ),
);
