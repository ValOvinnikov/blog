import {
  ENTITLEMENT_GRANT_EXPIRY,
  ENTITLEMENT_GRANT_NOTE_MAX_LENGTH,
  MOST_ADDITIONAL_LANGUAGES,
} from '@platform/constants/entitlement-grant';
import { toLocaleLimit } from '@platform/utils/locale-limit/locale-limit';
import {
  CAPABILITY,
  GRANTABLE_PRESET_IDS,
  MODULE_PACK,
} from '@shinefold/config/constants';
import { ENTITLEMENT_KIND, LOOK_FIELD } from '@shinefold/db/constants';
import { z } from 'zod';

const grantItemSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal(ENTITLEMENT_KIND.CAPABILITY),
    key: z.enum(CAPABILITY),
  }),
  z.object({
    kind: z.literal(ENTITLEMENT_KIND.MODULE_PACK),
    key: z.enum(MODULE_PACK),
  }),
  z.object({
    kind: z.literal(ENTITLEMENT_KIND.LOOK_FIELD),
    key: z.enum(LOOK_FIELD),
  }),
  z.object({
    kind: z.literal(ENTITLEMENT_KIND.PRESET),
    key: z.literal(GRANTABLE_PRESET_IDS),
  }),
  z.object({
    kind: z.literal(ENTITLEMENT_KIND.LOCALE_LIMIT),
    value: z
      .number()
      .int()
      .min(toLocaleLimit(1))
      .max(toLocaleLimit(MOST_ADDITIONAL_LANGUAGES)),
  }),
]);

export const entitlementGrantInputSchema = z.object({
  item: grantItemSchema,
  expiry: z.enum(ENTITLEMENT_GRANT_EXPIRY),
  note: z
    .string()
    .trim()
    .max(ENTITLEMENT_GRANT_NOTE_MAX_LENGTH)
    .transform((note) => note || null),
});

export type TEntitlementGrantInput = z.input<
  typeof entitlementGrantInputSchema
>;
