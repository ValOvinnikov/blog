// Threaded through every step of `run.ts`'s `runSteps` loop, accumulating
// exactly like `provision-tenant/run.ts` merges each step's partial result
// back into its `tenant` — except this context isn't a `tenants` row field,
// so it stays a separate object rather than merged into `TTenant`.
export type TDeprovisionContext = {
  // Set by `delete-sanity-project` when Sanity's org-billing-permission gate
  // blocked the actual project deletion — read by `clear-artifacts` so it
  // knows to leave `tenants.sanityProjectId` populated as the manual-
  // deletion signal instead of nulling it.
  keepSanityProjectId: boolean;
};

export const INITIAL_DEPROVISION_CONTEXT: TDeprovisionContext = {
  keepSanityProjectId: false,
};
