import { PinnedTenantsProvider } from '@platform/components/features/tenants/pinned-tenants-provider';
import {
  renderWithIntl,
  type RenderResult,
} from '@platform/testing/custom-render';
import type { TPinnedTenant } from '@platform/utils/pinned-tenants/pinned-tenants';
import { createElement, type ComponentType } from 'react';

type TPinnedTenantsTestState = {
  pinnedTenants?: TPinnedTenant[];
};

export const customRenderInPinnedTenants = <P extends object>(
  Component: ComponentType<P>,
  defaultProps: NoInfer<P>,
) => {
  return (
    overrides?: Partial<P>,
    { pinnedTenants = [] }: TPinnedTenantsTestState = {},
  ): RenderResult =>
    renderWithIntl(
      <PinnedTenantsProvider pinnedTenants={pinnedTenants}>
        {createElement(Component, { ...defaultProps, ...overrides })}
      </PinnedTenantsProvider>,
    );
};
