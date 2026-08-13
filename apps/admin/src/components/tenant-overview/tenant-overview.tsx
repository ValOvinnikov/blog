import { tenantOverviewVariants } from './tenant-overview-variants';

export type TTenantOverviewProps = {
  tenantSlug: string;
};

/**
 * The Tenant section's landing page. Deliberately minimal: Look and Voice
 * (the only two tabs planned for this milestone) each get their own route
 * and their own ticket — this page exists so the switcher and the
 * `memberships` gate have somewhere real to land in the meantime.
 */
export function TenantOverview({ tenantSlug }: TTenantOverviewProps) {
  const { root, title, description } = tenantOverviewVariants();

  return (
    <div className={root()}>
      <h1 className={title()}>{tenantSlug}</h1>
      <p className={description()}>
        Look and Voice ship soon — this is where they&apos;ll live.
      </p>
    </div>
  );
}
