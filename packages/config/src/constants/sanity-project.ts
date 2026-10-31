import type { TValueOf } from '@blog/config/utils';

export const SANITY_PROJECT_DELETE_OUTCOME = {
  DELETED: 'DELETED',
  ALREADY_GONE: 'ALREADY_GONE',
  BLOCKED_BY_BILLING_PERMISSION: 'BLOCKED_BY_BILLING_PERMISSION',
} as const;

export type TSanityProjectDeleteOutcome = TValueOf<
  typeof SANITY_PROJECT_DELETE_OUTCOME
>;

export const SANITY_PROJECT_ARCHIVE_OUTCOME = {
  ARCHIVED: 'ARCHIVED',
  ALREADY_ARCHIVED: 'ALREADY_ARCHIVED',
  ALREADY_GONE: 'ALREADY_GONE',
} as const;

export type TSanityProjectArchiveOutcome = TValueOf<
  typeof SANITY_PROJECT_ARCHIVE_OUTCOME
>;

export const SANITY_PROJECT_UNARCHIVE_OUTCOME = {
  UNARCHIVED: 'UNARCHIVED',
  ALREADY_ACTIVE: 'ALREADY_ACTIVE',
  ALREADY_GONE: 'ALREADY_GONE',
} as const;

export type TSanityProjectUnarchiveOutcome = TValueOf<
  typeof SANITY_PROJECT_UNARCHIVE_OUTCOME
>;

export const SANITY_PROJECT_TOGGLE_RESULT = {
  CHANGED: 'CHANGED',
  ALREADY_IN_STATE: 'ALREADY_IN_STATE',
  ALREADY_GONE: 'ALREADY_GONE',
} as const;

export type TSanityProjectToggleResult = TValueOf<
  typeof SANITY_PROJECT_TOGGLE_RESULT
>;

export const SANITY_PROJECT_ROLE = {
  ADMINISTRATOR: 'administrator',
  EDITOR: 'editor',
  VIEWER: 'viewer',
} as const;

export type TSanityProjectRole = TValueOf<typeof SANITY_PROJECT_ROLE>;

export const SANITY_RESOURCE_TYPE = {
  PROJECT: 'project',
  ORGANIZATION: 'organization',
} as const;

export type TSanityResourceType = TValueOf<typeof SANITY_RESOURCE_TYPE>;

export const SANITY_LOGIN_PROVIDER = {
  GOOGLE: 'GOOGLE',
  GITHUB: 'GITHUB',
  SANITY: 'SANITY',
} as const;

export type TSanityLoginProvider = TValueOf<typeof SANITY_LOGIN_PROVIDER>;

export const SANITY_ROBOT_ROLE = {
  DEVELOPER: 'developer',
  EDITOR: SANITY_PROJECT_ROLE.EDITOR,
  VIEWER: SANITY_PROJECT_ROLE.VIEWER,
} as const;

export type TSanityRobotRole = TValueOf<typeof SANITY_ROBOT_ROLE>;

export const SANITY_API_SURFACE = {
  MANAGEMENT: 'MANAGEMENT',
  ACCESS: 'ACCESS',
  WEBHOOKS: 'WEBHOOKS',
} as const;

export type TSanityApiSurface = TValueOf<typeof SANITY_API_SURFACE>;

export const TENANT_DELETE_SANITY_PROJECT_OUTCOME = {
  DELETED: 'DELETED',
  ALREADY_GONE: 'ALREADY_GONE',
  LEFT_ARCHIVED: 'LEFT_ARCHIVED',
  NO_PROJECT: 'NO_PROJECT',
  SKIPPED_NO_TOKEN: 'SKIPPED_NO_TOKEN',
} as const;

export type TTenantDeleteSanityProjectOutcome = TValueOf<
  typeof TENANT_DELETE_SANITY_PROJECT_OUTCOME
>;

export const TENANT_DELETE_OUTCOME = {
  DELETED: 'DELETED',
  NOT_ARCHIVED: 'NOT_ARCHIVED',
  NOT_FOUND: 'NOT_FOUND',
} as const;

export type TTenantDeleteOutcome = TValueOf<typeof TENANT_DELETE_OUTCOME>;
