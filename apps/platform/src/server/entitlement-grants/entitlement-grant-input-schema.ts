import { ENTITLEMENT_GRANT_NOTE_MAX_LENGTH } from '@platform/constants/entitlement-grant';
import {
  CAPABILITY,
  LOCALE_ISO_CODES,
  MODULE_PACK,
} from '@shinefold/config/constants';
import { ENTITLEMENT_KIND, LOOK_FIELD } from '@shinefold/db/constants';
import { z } from 'zod';

const LOCALE_COUNT = Object.values(LOCALE_ISO_CODES).length;

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
    kind: z.literal(ENTITLEMENT_KIND.LOCALE_LIMIT),
    value: z.number().int().min(2).max(LOCALE_COUNT),
  }),
]);

export const entitlementGrantInputSchema = z.object({
  item: grantItemSchema,
  expiresAt: z.coerce.date().nullable(),
  note: z
    .string()
    .trim()
    .max(ENTITLEMENT_GRANT_NOTE_MAX_LENGTH)
    .transform((note) => note || null),
});

export type TEntitlementGrantInput = z.input<
  typeof entitlementGrantInputSchema
>;
