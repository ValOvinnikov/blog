import { SUBSCRIBERS_SEARCH_PARAM } from '@platform/constants/subscribers';
import { DRAFT_PREVIEW_SEGMENT } from '@platform/utils/draft-preview-routes/draft-preview-routes';
import {
  ARCHIVED_PARAM_ON,
  DEFAULT_TENANTS_SORT,
  type TTenantsListQuery,
} from '@platform/utils/tenants-list-query/tenants-list-query';

/**
 * The final path segment both Studio routes share — also matched against
 * `useSelectedLayoutSegment()` by `ShellFrame` to switch `PlatformShell`'s
 * content column into full-bleed mode.
 */
export const STUDIO_SEGMENT = 'studio';

const STUDIO_STRUCTURE_TOOL = 'structure';
const STUDIO_PAGES_PANE = 'pages';

export const SIGN_IN_PATH = '/sign-in';

export const adminRoutes = {
  home: () => '/',
  signIn: (callbackUrl = '/') =>
    `${SIGN_IN_PATH}?${new URLSearchParams({ callbackUrl })}`,
  signInError: () => '/sign-in-error',
  signUp: () => '/signup',
  onboarding: () => '/onboarding',
  tenants: ({
    shouldShowArchived = false,
    sort = DEFAULT_TENANTS_SORT,
    search = '',
  }: Partial<TTenantsListQuery> = {}) => {
    const params = new URLSearchParams();
    if (shouldShowArchived) params.set('archived', ARCHIVED_PARAM_ON);
    if (
      sort.column !== DEFAULT_TENANTS_SORT.column ||
      sort.direction !== DEFAULT_TENANTS_SORT.direction
    ) {
      params.set('sort', sort.column);
      params.set('direction', sort.direction);
    }
    if (search) params.set('q', search);
    const query = params.toString();
    return query ? `/tenants?${query}` : '/tenants';
  },
  newTenant: () => '/tenants/new',
  findings: () => '/findings',
  releases: () => '/releases',
  blockedSignups: () => '/blocked-signups',
  dataRequests: () => '/data-requests',
  tenantOverview: (tenantId: string) => `/tenants/${tenantId}`,
  tenantProvisioning: (tenantId: string) => `/tenants/${tenantId}/provisioning`,
  tenantDanger: (tenantId: string) => `/tenants/${tenantId}/danger`,
  tenantDomain: (tenantId: string) => `/tenants/${tenantId}/domain`,
  tenantSignIn: (tenantId: string) => `/tenants/${tenantId}/sign-in`,
  look: (tenantId: string) => `/tenants/${tenantId}/look`,
  voice: (tenantId: string) => `/tenants/${tenantId}/voice`,
  features: (tenantId: string) => `/tenants/${tenantId}/features`,
  languages: (tenantId: string) => `/tenants/${tenantId}/languages`,
  email: (tenantId: string) => `/tenants/${tenantId}/email`,
  leads: (tenantId: string) => `/tenants/${tenantId}/leads`,
  tenantTeam: (tenantId: string) => `/tenants/${tenantId}/team`,
  tenantActivity: (tenantId: string, page = 1) =>
    page > 1
      ? `/tenants/${tenantId}/activity?page=${page}`
      : `/tenants/${tenantId}/activity`,
  tenantStudio: (tenantId: string) => `/tenants/${tenantId}/${STUDIO_SEGMENT}`,
  tenantDraftPreviews: (tenantId: string) =>
    `/tenants/${tenantId}/${DRAFT_PREVIEW_SEGMENT}`,
  tenantDraftPreview: (tenantId: string, documentId: string) =>
    `${adminRoutes.tenantDraftPreviews(tenantId)}/${encodeURIComponent(documentId)}`,
  tenantHelp: (tenantId: string) => `/tenants/${tenantId}/help`,
  dashboard: () => '/dashboard',
  dashboardDomain: () => '/dashboard/domain',
  dashboardSignIn: () => '/dashboard/sign-in',
  dashboardLook: () => '/dashboard/look',
  dashboardVoice: () => '/dashboard/voice',
  dashboardFeatures: () => '/dashboard/features',
  dashboardLanguages: () => '/dashboard/languages',
  dashboardEmail: () => '/dashboard/email',
  dashboardLeads: () => '/dashboard/leads',
  dashboardSubscribers: (page = 1) =>
    page > 1 ? `/dashboard/subscribers?page=${page}` : '/dashboard/subscribers',
  dashboardSubscribersMovedUp: (ceiling: number) =>
    `${adminRoutes.dashboardSubscribers()}?${new URLSearchParams({ [SUBSCRIBERS_SEARCH_PARAM.MOVED_UP]: String(ceiling) })}`,
  dashboardUpgrade: () => '/dashboard/upgrade',
  dashboardTeam: () => '/dashboard/team',
  dashboardBilling: () => '/dashboard/billing',
  dashboardStudio: () => `/dashboard/${STUDIO_SEGMENT}`,
  dashboardStudioPages: () =>
    `${adminRoutes.dashboardStudio()}/${STUDIO_STRUCTURE_TOOL}/${STUDIO_PAGES_PANE}`,
  dashboardDraftPreviews: () => `/dashboard/${DRAFT_PREVIEW_SEGMENT}`,
  dashboardDraftPreview: (documentId: string) =>
    `${adminRoutes.dashboardDraftPreviews()}/${encodeURIComponent(documentId)}`,
  dashboardHelp: () => '/dashboard/help',
  dashboardSelectTenant: () => '/dashboard/select-tenant',
  dashboardSelectTenantHref: (tenantId: string) =>
    `/api/dashboard/select-tenant?tenantId=${tenantId}`,
} as const;

export const tenantSiteUrl = (domain: string) => `https://${domain}`;
