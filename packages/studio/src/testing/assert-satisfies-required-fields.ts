import { hasLength, isUndefined } from '@shinefold/utils/primitives';

type TValidatableField = {
  name: string;
  validation?: unknown;
};

type TSchemaWithFields = {
  fields?: readonly TValidatableField[];
};

export type TExemptField = {
  name: string;
  reason: string;
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

export const assertSatisfiesRequiredFields = (
  schemaType: TSchemaWithFields,
  payload: Record<string, unknown>,
  exemptFields: TExemptField[] = [],
): void => {
  const exemptNames = new Set(exemptFields.map((exempt) => exempt.name));

  const missing = getRequiredFieldNames(schemaType).filter(
    (name) => !exemptNames.has(name) && isUndefined(payload[name]),
  );

  if (hasLength(missing)) {
    throw new Error(
      `assertSatisfiesRequiredFields: payload is missing required field(s): ${missing.join(', ')}`,
    );
  }
};
