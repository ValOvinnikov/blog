import { TENANT_PLAN, type TTenantPlan } from '@shinefold/config/constants';

export const PLAN_DOCUMENT_CAP: Partial<Record<TTenantPlan, number>> = {
  [TENANT_PLAN.FREE]: 10_000,
};
export const DOCUMENT_CAP_WARNING_RATIO = 0.8;
export const DOCUMENT_CAP_FINDING_IDENTIFIER = 'document-cap';
export const DOCUMENT_CAP_UNCOUNTED_TYPES = [
  'sanity.imageAsset',
  'sanity.fileAsset',
  'sanity.videoAsset',
  'sanity.tree',
  'sanity.directory',
  'sanity.symlink',
  'sanity.assist.task.status',
] as const;
export const DOCUMENT_CAP_UNCOUNTED_TYPE_PREFIX = 'system.';
export const DOCUMENT_CAP_LOG = {
  SWEEP_NOT_CONFIGURED: 'document_cap.sweep_not_configured',
  SWEEP_FAILED: 'document_cap.sweep_failed',
  SWEEP_TENANT_FAILED: 'document_cap.sweep_tenant_failed',
  SWEEP_FINISHED: 'document_cap.sweep_finished',
} as const;
export const DOCUMENT_CAP_CHECK = {
  NEARING: 'NEARING',
  CLEAR: 'CLEAR',
  SKIPPED: 'SKIPPED',
} as const;
