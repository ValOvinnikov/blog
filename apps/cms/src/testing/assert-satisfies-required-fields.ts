/**
 * A migration writes documents straight through the Sanity API, so Studio
 * field defaults and the create-form's required-field prompts never fire —
 * every required field has to be set explicitly by the migration code
 * itself. This walks a schema type's `validation` rule chains (a
 * proxy-tracked fake `Rule` records whether `.required()` was called
 * anywhere in the chain) and asserts a payload sets every field the schema
 * demands.
 */

/**
 * Loosely shaped to structurally accept a real `defineType`/`defineField`
 * result without importing Sanity's own field/rule types. `validation` is
 * typed `unknown` because Sanity's own type is a union of a validation
 * function and other static shapes — narrowed with `typeof … === 'function'`
 * before being invoked.
 */
type TValidatableField = {
  name: string;
  validation?: unknown;
};

type TSchemaWithFields = {
  fields?: readonly TValidatableField[];
};

const createTrackingRule = (): { rule: never; wasRequired: () => boolean } => {
  let required = false;

  const handler: ProxyHandler<() => unknown> = {
    get(_target, prop) {
      if (prop === 'required') {
        return () => {
          required = true;
          return proxy;
        };
      }
      return () => proxy;
    },
  };

  const proxy = new Proxy(() => proxy, handler);

  return { rule: proxy as never, wasRequired: () => required };
};

const isFieldRequired = (field: TValidatableField): boolean => {
  if (typeof field.validation !== 'function') return false;

  const { rule, wasRequired } = createTrackingRule();

  (field.validation as (rule: never) => unknown)(rule);

  return wasRequired();
};

const getRequiredFieldNames = (schemaType: TSchemaWithFields): string[] =>
  (schemaType.fields ?? []).filter(isFieldRequired).map((field) => field.name);

/**
 * Asserts `payload` sets every field `schemaType` marks required (a
 * `validation` chain that calls `.required()`). Throws, naming the missing
 * field(s), if any are absent or explicitly `undefined`.
 */
export const assertSatisfiesRequiredFields = (
  schemaType: TSchemaWithFields,
  payload: Record<string, unknown>,
): void => {
  const missing = getRequiredFieldNames(schemaType).filter(
    (name) => payload[name] === undefined,
  );

  if (missing.length > 0) {
    throw new Error(
      `assertSatisfiesRequiredFields: payload is missing required field(s): ${missing.join(', ')}`,
    );
  }
};
