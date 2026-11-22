export const DRAFT_PREVIEW_SEGMENT = 'preview';

export const DRAFT_PREVIEW_ROUTE_SOURCES = [
  `/dashboard/${DRAFT_PREVIEW_SEGMENT}/:documentId`,
  `/tenants/:tenantId/${DRAFT_PREVIEW_SEGMENT}/:documentId`,
];
