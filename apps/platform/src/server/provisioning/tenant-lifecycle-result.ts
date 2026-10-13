export type TTenantLifecycleErrorReason =
  | 'confirmRequired'
  | 'notFound'
  | 'nameMismatch'
  | 'alreadyDeprovisioned'
  | 'notDeprovisioned'
  | 'alreadyInProgress'
  | 'notArchived'
  | 'deprovisionFailed'
  | 'reactivateFailed'
  | 'deleteFailed';

export type TTenantLifecycleResult<
  TReason extends TTenantLifecycleErrorReason,
> = { ok: true } | { ok: false; reason: TReason };
