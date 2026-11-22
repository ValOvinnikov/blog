import type { TActivityDetail } from '@platform/components/features/tenants/activity-list/activity-detail';
import { ACTIVITY_DETAIL } from '@platform/constants/activity';
import type { TMaybeNull } from '@shinefold/config';
import { ENTITLEMENT_KIND } from '@shinefold/db/constants';
import { hasLength, isNull, isString } from '@shinefold/utils/primitives';
import { z } from 'zod';

const grantDetailsSchema = z.object({
  kind: z.enum(ENTITLEMENT_KIND),
  key: z.string(),
  value: z.number().nullable().catch(null),
  expiresAt: z.iso.datetime().nullable().optional().catch(undefined),
  note: z.string().optional().catch(undefined),
});

export const toGrantActivityDetails = (
  details: TMaybeNull<Record<string, unknown>>,
): TActivityDetail[] => {
  const parsed = grantDetailsSchema.safeParse(details ?? {});
  if (!parsed.success) return [];

  const { kind, key, value, expiresAt, note } = parsed.data;
  const candidates: Array<TActivityDetail | false> = [
    { kind: ACTIVITY_DETAIL.GRANT_ITEM, item: { kind, key, value } },
    isNull(expiresAt) && { kind: ACTIVITY_DETAIL.GRANT_UNTIL_REVOKED },
    isString(expiresAt) && {
      kind: ACTIVITY_DETAIL.GRANT_EXPIRY,
      expiresAt: new Date(expiresAt),
    },
    hasLength(note) && { kind: ACTIVITY_DETAIL.GRANT_NOTE, note },
  ];

  return candidates.filter((detail): detail is TActivityDetail =>
    Boolean(detail),
  );
};
