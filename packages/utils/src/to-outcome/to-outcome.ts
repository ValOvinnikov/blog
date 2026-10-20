export const toOutcome = <TOutcome extends string>(
  outcome: TOutcome,
): { outcome: TOutcome } => ({ outcome });
