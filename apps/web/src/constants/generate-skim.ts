export const GENERATE_SKIM_LOG = {
  CONFIG_MISSING: 'generate_skim.config_missing',
  HOST_UNRESOLVABLE: 'generate_skim.host_unresolvable',
  WRITE_TENANT_UNRESOLVABLE: 'generate_skim.write_tenant_unresolvable',
  TENANT_WRITE_CREDENTIALS_MISSING:
    'generate_skim.tenant_write_credentials_missing',
  TENANT_NOT_ACTIVE: 'generate_skim.tenant_not_active',
  ALLOWANCE_USED: 'generate_skim.allowance_used',
  CLAIM_FAILED: 'generate_skim.claim_failed',
  CLAIM_RELEASE_FAILED: 'generate_skim.claim_release_failed',
  POST_BODY_FETCH_FAILED: 'generate_skim.post_body_fetch_failed',
  GENERATION_FAILED: 'generate_skim.generation_failed',
  WRITE_CLIENT_UNCONFIGURED: 'generate_skim.write_client_unconfigured',
  DRAFT_SAVE_FAILED: 'generate_skim.draft_save_failed',
} as const;
