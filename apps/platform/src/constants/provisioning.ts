export const PROVISIONING_LOG = {
  DEPROVISION_AUDIT_FAILED: 'provisioning.deprovision_audit_failed',
  DEPROVISION_DISPATCH_ERROR: 'provisioning.deprovision_dispatch_error',
  DEPROVISION_DISPATCH_FAILED: 'provisioning.deprovision_dispatch_failed',
  DEPROVISION_DISPATCH_SKIPPED: 'provisioning.deprovision_dispatch_skipped',
  DOMAIN_CHECK_ERROR: 'provisioning.domain_check_error',
  DOMAIN_CHECK_FAILED: 'provisioning.domain_check_failed',
  DOMAIN_CHECK_INVALID_DOMAIN: 'provisioning.domain_check_invalid_domain',
  ENQUEUE_FAILED: 'provisioning.enqueue_failed',
  ENQUEUE_NOT_FOUND: 'provisioning.enqueue_not_found',
  REACTIVATE_AUDIT_FAILED: 'provisioning.reactivate_audit_failed',
} as const;
