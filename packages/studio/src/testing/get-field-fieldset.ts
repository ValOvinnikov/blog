/**
 * Reads the fieldset name a field was grouped into.
 */
export const getFieldset = (field: {
  fieldset?: unknown;
}): string | undefined => field.fieldset as string | undefined;
