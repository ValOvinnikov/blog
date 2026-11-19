import { LookPageContent } from '@platform/components/features/look/look-page-content/look-page-content';
import { customRenderAsync } from '@platform/testing/custom-render';
import { mockViewer } from '@platform/testing/memberships/fixtures';
import { mockReadyTenant } from '@platform/testing/tenants/fixtures';

export const setupLookPageContent = customRenderAsync(LookPageContent, {
  tenant: mockReadyTenant(),
  viewer: mockViewer(),
});
