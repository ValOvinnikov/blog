import { toTitleCase } from '@blog/utils/primitives';

/** Builds a module's preview subtitle: its brand variant, then any module-specific detail, separated by a middle dot. */
export const moduleSubtitle = (
  brandVariant: unknown,
  ...details: (string | undefined)[]
): string | undefined => {
  const parts = [
    typeof brandVariant === 'string' ? toTitleCase(brandVariant) : undefined,
    ...details,
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(' · ') : undefined;
};
