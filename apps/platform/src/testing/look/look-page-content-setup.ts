import { LOCALE_ISO_CODES } from '@blog/config';
import { LookPageContent } from '@platform/components/features/look/look-page-content/look-page-content';
import { customRenderAsync } from '@platform/testing/custom-render';
import { mockReadyTenant } from '@platform/testing/tenants/fixtures';

export const setupLookPageContent = customRenderAsync(LookPageContent, {
  tenant: mockReadyTenant(),
});

export const arrangeLookPageQueries = (queries: {
  getSiteConfig: ReturnType<typeof vi.fn>;
  selectLiveLocales: ReturnType<typeof vi.fn>;
}) => {
  queries.getSiteConfig.mockResolvedValue(undefined);
  queries.selectLiveLocales.mockReturnValue([LOCALE_ISO_CODES.EN]);
};
